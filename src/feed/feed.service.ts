import { Injectable } from "@nestjs/common";
import { FeedRepository } from "./feed.repository";
import { FeedItem } from "./schemas/feed-item.schema";
import { TagsService } from "./tags.service";
import { PostDocument } from "../content/posts/schemas/post.schema";

@Injectable()
export class FeedService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly tagsService: TagsService,
  ) {}

  async syncPostToFeed(
    tenantId: string,
    tenantSlug: string,
    tenantName: string,
    authorUsername: string,
    post: PostDocument,
  ) {
    if (post.status !== "published") {
      await this.deletePostFromFeed(tenantId, post._id.toString(), post.tags);
      return;
    }

    const feedItem: Partial<FeedItem> = {
      tenantId,
      tenantSlug,
      tenantName,
      postId: post._id.toString(),
      postSlug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      featuredImageAttribution: post.featuredImageAttribution,
      authorName: post.authorName,
      authorUsername: authorUsername,
      authorAvatar: post.authorAvatar,
      publishedAt: post.publishedAt || new Date(),
      tags: post.tags,
    };

    await this.feedRepository.upsert(feedItem);
    if (post.tags) {
      await this.tagsService.incrementCounts(post.tags);
    }
  }

  async updateLikes(
    postId: string,
    userId: string,
    increment: boolean,
  ): Promise<void> {
    return this.feedRepository.updateLikes(postId, userId, increment);
  }

  async updateCommentsCount(postId: string, increment: boolean): Promise<void> {
    return this.feedRepository.updateCommentsCount(postId, increment);
  }

  async getGlobalFeed(
    page: number = 1,
    limit: number = 20,
    tag?: string,
    ids?: string[],
  ) {
    const skip = (page - 1) * limit;
    return this.feedRepository.findAll({ skip, limit, tag, ids });
  }

  async deletePostFromFeed(tenantId: string, postId: string, tags?: string[]) {
    const existing = await this.feedRepository.delete(tenantId, postId);
    if (existing.deletedCount > 0 && tags) {
      await this.tagsService.decrementCounts(tags);
    }
  }

  async search(query: string, tenantId?: string) {
    let sanitizedQuery = query;
    if (query.startsWith("#")) {
      sanitizedQuery = query.substring(1);
    }

    return this.feedRepository.search(sanitizedQuery, tenantId);
  }

  async suggest(query: string, tenantId?: string) {
    let sanitizedQuery = query;
    if (query.startsWith("#")) {
      sanitizedQuery = query.substring(1);
    }
    return this.feedRepository.suggest(sanitizedQuery, tenantId);
  }
}
