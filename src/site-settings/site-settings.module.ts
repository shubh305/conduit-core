import { Module } from "@nestjs/common";
import { SiteSettingsController } from "./site-settings.controller";
import { SiteSettingsService } from "./site-settings.service";
import { SiteSettingsRepository } from "./site-settings.repository";

@Module({
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, SiteSettingsRepository],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
