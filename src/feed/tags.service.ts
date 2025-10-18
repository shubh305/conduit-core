import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GlobalTag, GlobalTagDocument } from "./schemas/global-tag.schema";

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(GlobalTag.name) private tagModel: Model<GlobalTagDocument>,
  ) {}

  async incrementCounts(tags: string[]) {
    if (!tags || tags.length === 0) return;

    const operations = tags.map((tag) => ({
      updateOne: {
        filter: { slug: tag },
        update: {
          $inc: { postsCount: 1 },
          $setOnInsert: { name: this.capitalizeTag(tag) },
        },
        upsert: true,
      },
    }));

    await this.tagModel.bulkWrite(operations);
  }

  async decrementCounts(tags: string[]) {
    if (!tags || tags.length === 0) return;

    const operations = tags.map((tag) => ({
      updateOne: {
        filter: { slug: tag },
        update: { $inc: { postsCount: -1 } },
      },
    }));

    await this.tagModel.bulkWrite(operations);
  }

  private capitalizeTag(slug: string): string {
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  async search(query: string): Promise<GlobalTagDocument[]> {
    return this.tagModel
      .find({
        name: { $regex: query, $options: "i" },
      })
      .limit(10)
      .exec();
  }
}
