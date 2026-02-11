import { Injectable } from "@nestjs/common";
import { Connection, Model } from "mongoose";
import { SiteSettings, SiteSettingsSchema, SiteSettingsDocument } from "./schemas/site-settings.schema";

@Injectable()
export class SiteSettingsRepository {
  private getModel(connection: Connection): Model<SiteSettingsDocument> {
    return connection.model(SiteSettings.name, SiteSettingsSchema) as unknown as Model<SiteSettingsDocument>;
  }

  async findOne(connection: Connection): Promise<SiteSettingsDocument | null> {
    const model = this.getModel(connection);
    return model.findOne().exec();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, k) => {
      const pre = prefix.length ? prefix + "." : "";
      const value = obj[k];
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(acc, this.flattenObject(value as Record<string, unknown>, pre + k));
      } else {
        acc[pre + k] = value;
      }
      return acc;
    }, {});
  }

  async upsert(connection: Connection, settings: Partial<SiteSettings>): Promise<SiteSettingsDocument> {
    const model = this.getModel(connection);

    const update = this.flattenObject(settings);

    const result = await model
      .findOneAndUpdate({}, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true })
      .exec();

    return result as SiteSettingsDocument;
  }
}
