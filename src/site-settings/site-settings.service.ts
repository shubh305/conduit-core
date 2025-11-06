import { Injectable } from "@nestjs/common";
import { Connection } from "mongoose";
import { SiteSettingsRepository } from "./site-settings.repository";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { SiteSettingsDocument } from "./schemas/site-settings.schema";

@Injectable()
export class SiteSettingsService {
  constructor(private readonly repository: SiteSettingsRepository) {}

  async getSettings(connection: Connection): Promise<SiteSettingsDocument> {
    const settings = await this.repository.findOne(connection);
    if (!settings) {
      return this.repository.upsert(connection, {});
    }
    return settings;
  }

  async updateSettings(
    connection: Connection,
    dto: UpdateSiteSettingsDto,
  ): Promise<SiteSettingsDocument> {
    return this.repository.upsert(connection, dto);
  }
}
