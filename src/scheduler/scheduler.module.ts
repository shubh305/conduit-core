import { Module } from "@nestjs/common";
import { ScheduleModule as NestScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { SchedulerService } from "./scheduler.service";
import { ContentModule } from "../content/content.module";
import { DatabaseModule } from "../database/database.module";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [NestScheduleModule.forRoot(), ConfigModule, DatabaseModule, TenantsModule, ContentModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
