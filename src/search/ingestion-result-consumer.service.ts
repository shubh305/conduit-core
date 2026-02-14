import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer } from "kafkajs";
import { DatabaseService } from "../database/database.service";
import { PostsService } from "../content/posts/posts.service";

interface IngestionResult {
  entity_id: string;
  entity_type: string;
  summary?: string;
  index_name: string;
  status: string;
}

@Injectable()
export class IngestionResultConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionResultConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly postsService: PostsService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService.get<string>("KAFKA_BROKERS");
    const user = this.configService.get<string>("KAFKA_SASL_USER");
    const pass = this.configService.get<string>("KAFKA_SASL_PASS");

    if (!brokers) {
      this.logger.warn("KAFKA_BROKERS not configured. Ingestion result consumer will not start.");
      return;
    }

    this.kafka = new Kafka({
      clientId: "conduit-core",
      brokers: brokers.split(","),
      sasl: user
        ? {
            mechanism: "plain",
            username: user,
            password: pass,
          }
        : undefined,
      ssl: brokers.includes(":9092"),
    });

    this.consumer = this.kafka.consumer({ groupId: "conduit-ingestion-consumer" });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: "octane.ingest.results", fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            const payload = JSON.parse(message.value?.toString() || "{}") as IngestionResult;
            await this.handleResult(payload);
          } catch (e) {
            this.logger.error(`Error parsing Kafka message: ${e.message}`);
          }
        },
      });

      this.logger.log("Ingestion result consumer started and subscribed to octane.ingest.results");
    } catch (error) {
      this.logger.error(`Failed to start Kafka consumer: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer?.disconnect();
    } catch (e) {
      this.logger.error(`Error disconnecting Kafka consumer: ${e.message}`);
    }
  }

  private async handleResult(data: IngestionResult) {
    const { entity_id, entity_type, summary, index_name, status } = data;

    if (status === "completed" && entity_type === "blog_post" && summary) {
      try {
        const tenantPrefix = this.configService.get<string>("SEARCH_TENANT_INDEX_PREFIX") || "conduit_";
        const tenantId = index_name.replace(tenantPrefix, "");

        this.logger.log(`Received Kafka result: updating summary for post ${entity_id} in tenant ${tenantId}`);

        const dbName = this.databaseService.getTenantDatabaseName(tenantId);
        const connection = await this.databaseService.getTenantConnection(dbName);

        await this.postsService.updateSummary(connection, entity_id, summary);
      } catch (error) {
        this.logger.error(`Failed to process ingestion result for ${entity_id}: ${error.message}`);
      }
    }
  }
}
