import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import { FeedItem, FeedItemDocument } from "./schemas/feed-item.schema";

@Injectable()
export class FeedRepository {
  constructor(
    @InjectModel(FeedItem.name) private feedModel: Model<FeedItemDocument>,
  ) {}

  async upsert(item: Partial<FeedItem>): Promise<FeedItemDocument> {
    return this.feedModel
      .findOneAndUpdate(
        { tenantId: item.tenantId, postId: item.postId },
        { $set: item },
        { upsert: true, new: true },
      )
      .exec() as Promise<FeedItemDocument>;
  }

  async delete(
    tenantId: string,
    postId: string,
  ): Promise<{ deletedCount: number }> {
    return this.feedModel.deleteOne({ tenantId, postId }).exec();
  }

  async deleteByTenant(tenantId: string): Promise<{ deletedCount: number }> {
    return this.feedModel.deleteMany({ tenantId }).exec();
  }

  async updateLikes(
    postId: string,
    userId: string,
    increment: boolean,
  ): Promise<void> {
    const query = increment
      ? { postId, likedBy: { $ne: userId } }
      : { postId, likedBy: userId };
    const update = increment
      ? { $addToSet: { likedBy: userId }, $inc: { likesCount: 1 } }
      : { $pull: { likedBy: userId }, $inc: { likesCount: -1 } };

    await this.feedModel.updateOne(query, update).exec();
  }

  async updateCommentsCount(postId: string, increment: boolean): Promise<void> {
    await this.feedModel
      .updateOne({ postId }, { $inc: { commentsCount: increment ? 1 : -1 } })
      .exec();
  }

  async findAll(
    options: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      tag?: string;
      ids?: string[];
    } = {},
  ): Promise<FeedItemDocument[]> {
    const filter: FilterQuery<FeedItemDocument> = {};
    if (options.tag) {
      filter.tags = options.tag;
    }
    if (options.ids && options.ids.length > 0) {
      filter.postId = { $in: options.ids };
    }

    return this.feedModel
      .find(filter)
      .sort(options.sort || { publishedAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .exec();
  }

  async search(query: string, tenantId?: string): Promise<FeedItemDocument[]> {
    const filter: FilterQuery<FeedItemDocument> = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { excerpt: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
        { authorName: { $regex: query, $options: "i" } },
        { authorUsername: { $regex: query, $options: "i" } },
      ],
    };

    if (tenantId) {
      filter.tenantId = tenantId;
    }

    return this.feedModel
      .find(filter)
      .sort({ publishedAt: -1 })
      .limit(20)
      .exec();
  }

  async suggest(query: string, tenantId?: string): Promise<FeedItemDocument[]> {
    const filter: FilterQuery<FeedItemDocument> = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { authorUsername: { $regex: query, $options: "i" } },
      ],
    };

    if (tenantId) {
      filter.tenantId = tenantId;
    }

    return this.feedModel
      .find(filter)
      .select("title postSlug tenantSlug authorUsername")
      .limit(5)
      .exec();
  }
}
