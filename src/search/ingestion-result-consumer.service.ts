import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kafka, Consumer } from "kafkajs";
import { DatabaseService } from "../database/database.service";
import { PostsService } from "../content/posts/posts.service";

interface IngestionResult {
  entity_id: string;
  entity_type: string;
  summary?: string;
  entities?: string[];
  key_concepts?: string[];
  language?: string;
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
    const topic = this.configService.get<string>("KAFKA_INGEST_RESULTS_TOPIC");
    const consumerGroup = this.configService.get<string>("KAFKA_INGEST_RESULTS_CONSUMER_GROUP");

    if (!brokers) {
      this.logger.warn("KAFKA_BROKERS not configured. Ingestion result consumer will not start.");
      return;
    }

    this.kafka = new Kafka({
      clientId: this.configService.get<string>("KAFKA_CLIENT_ID", "conduit-core"),
      brokers: brokers.split(","),
      sasl: user
        ? {
            mechanism: "plain",
            username: user,
            password: pass,
          }
        : undefined,
      ssl: false,
    });

    this.consumer = this.kafka.consumer({ groupId: consumerGroup });

    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic: topic, fromBeginning: false });

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

      this.logger.log("Ingestion result consumer started and subscribed to " + topic);
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
    const { entity_id, entity_type, summary, entities, key_concepts, language, index_name, status } = data;

    if (status === "completed" && entity_type === "blog_post") {
      try {
        const tenantPrefix = this.configService.get<string>("SEARCH_TENANT_INDEX_PREFIX") || "conduit_";
        const tenantId = index_name.split(tenantPrefix).pop() || "";

        this.logger.log(`Received Kafka result: updating enrichments for post ${entity_id} in tenant ${tenantId}`);

        const dbName = this.databaseService.getTenantDatabaseName(tenantId);
        const connection = await this.databaseService.getTenantConnection(dbName);

        await this.postsService.updateEnrichments(connection, entity_id, {
          summary,
          entities,
          keyConcepts: key_concepts,
          language,
        });
      } catch (error) {
        this.logger.error(`Failed to process ingestion result for ${entity_id}: ${error.message}`);
      }
    }
  }
}
