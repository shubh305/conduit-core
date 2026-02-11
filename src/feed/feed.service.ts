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

    const p = post.toObject ? post.toObject() : post;
    const feedItem: Partial<FeedItem> = {
      tenantId,
      tenantSlug,
      tenantName,
      postId: p._id.toString(),
      postSlug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      featuredImage: p.featuredImage,
      featuredImageAttribution: p.featuredImageAttribution,
      authorName: p.authorName,
      authorId: p.authorId?.toString(),
      authorUsername: authorUsername || p.authorUsername,
      authorAvatar: p.authorAvatar,
      publishedAt: p.publishedAt || new Date(),
      tags: p.tags,
    };

    if (!feedItem.authorId) {
      console.warn(`[FeedService] Missing authorId for post ${p._id}, skipping sync`);
      return;
    }

    await this.feedRepository.upsert(feedItem);
    if (post.tags) {
      await this.tagsService.incrementCounts(post.tags);
    }
  }

  async updateLikes(postId: string, userId: string, increment: boolean): Promise<void> {
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
    authorUsernames?: string[],
    authorIds?: string[],
  ) {
    const skip = (page - 1) * limit;
    return this.feedRepository.findAll({ skip, limit, tag, ids, authorUsernames, authorIds });
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
