import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "../database/database.service";
import { TenantsRepository } from "../tenants/tenants.repository";
import { PostsService } from "../content/posts/posts.service";
import { TenantDocument } from "../tenants/schemas/tenant.schema";

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly tenantsRepository: TenantsRepository,
    private readonly postsService: PostsService,
  ) {}

  @Cron("*/10 * * * *")
  async publishScheduledPosts() {
    this.logger.log("Checking for scheduled posts...");

    try {
      const tenants = (await this.tenantsRepository.findAll()) as TenantDocument[];

      for (const tenant of tenants) {
        try {
          const tenantId = tenant.id || tenant._id.toString();
          const databaseName = this.databaseService.getTenantDatabaseName(tenantId);

          const connection = await this.databaseService.getTenantConnection(databaseName);
          const duePosts = await this.postsService.findScheduledPostsDue(connection);

          if (duePosts.length > 0) {
            this.logger.log(`Found ${duePosts.length} due posts for tenant ${tenant.slug}`);

            for (const post of duePosts) {
              await this.postsService.publishScheduledPost(connection, post, tenant);
            }
          }
        } catch (e) {
          this.logger.error(`Failed to process tenant ${tenant.slug}: ${e.message}`);
        }
      }
    } catch (e) {
      this.logger.error(`Scheduler failed: ${e.message}`);
    }
  }
}
