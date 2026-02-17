import { Injectable, NotFoundException } from "@nestjs/common";
import { Connection, FilterQuery } from "mongoose";
import slugify from "slugify";
import { PostsRepository } from "./posts.repository";
import { CreatePostDto, UpdatePostDto } from "./dto/post.dto";
import { PostDocument, TiptapNode, TiptapContent } from "./schemas/post.schema";
import { FeedService } from "../../feed/feed.service";
import { Tenant } from "../../tenants/schemas/tenant.schema";
import { SemanticSearchService } from "../../search/semantic-search.service";
import { RESERVED_POST_SLUGS } from "../../common/constants";

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly feedService: FeedService,
    private readonly semanticSearchService: SemanticSearchService,
  ) {}

  /**
   * Creates a new post for the tenant.
   * Auto-generates slug from title if not provided.
   */
  async create(
    connection: Connection,
    tenant: Tenant,
    createPostDto: CreatePostDto,
    authorId: string,
    authorName: string,
    authorUsername: string,
  ): Promise<PostDocument> {
    const slug = await this.generateUniqueSlug(connection, createPostDto.slug || createPostDto.title);

    const post = await this.postsRepository.create(connection, {
      ...createPostDto,
      slug,
      authorId,
      authorName,
      authorUsername,
      tenantId: tenant["_id"]
        ? (tenant["_id"] as unknown as string).toString()
        : (tenant as unknown as { id: string }).id,
      publishedAt: createPostDto.status === "published" ? new Date() : undefined,
      scheduledAt:
        createPostDto.status === "scheduled" && createPostDto.scheduledAt
          ? new Date(createPostDto.scheduledAt)
          : undefined,
    });

    if (post.status === "published") {
      await this.feedService.syncPostToFeed(
        tenant["_id"] ? (tenant["_id"] as unknown as string).toString() : (tenant as unknown as { id: string }).id,
        tenant.slug,
        tenant.name,
        authorUsername,
        post,
      );
      await this.ingestPost(post, tenant);
    }

    return post;
  }

  async findAll(
    connection: Connection,
    page: number = 1,
    limit: number = 10,
    status?: string,
    authorId?: string,
    tenantId?: string,
    ids?: string[],
  ) {
    const filter: FilterQuery<PostDocument> = { deletedAt: { $exists: false } };

    if (ids && ids.length > 0) {
      filter._id = { $in: ids };
    }

    if (status === "deleted") {
      filter.deletedAt = { $exists: true };
    } else if (status) {
      filter.status = status;
    }
    if (authorId) filter.authorId = authorId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.postsRepository.findAll(connection, filter, { skip, limit }),
      this.postsRepository.count(connection, filter),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(connection: Connection, id: string): Promise<PostDocument> {
    const post = await this.postsRepository.findById(connection, id);
    if (!post || post.deletedAt) throw new NotFoundException("Post not found");
    return post;
  }

  async findBySlug(connection: Connection, slug: string): Promise<PostDocument | null> {
    return this.postsRepository.findBySlug(connection, slug);
  }

  async search(connection: Connection, query: string): Promise<PostDocument[]> {
    return this.postsRepository.search(connection, query);
  }

  async incrementLikes(connection: Connection, id: string, userId: string): Promise<void> {
    await this.postsRepository.incrementLikes(connection, id, userId);
    this.feedService.updateLikes(id, userId, true).catch(() => {});
  }

  async decrementLikes(connection: Connection, id: string, userId: string): Promise<void> {
    await this.postsRepository.decrementLikes(connection, id, userId);
    this.feedService.updateLikes(id, userId, false).catch(() => {});
  }

  async update(
    connection: Connection,
    id: string,
    updatePostDto: UpdatePostDto,
    tenant?: Tenant,
  ): Promise<PostDocument> {
    const post = await this.findOne(connection, id);

    let slug = updatePostDto.slug;
    if (slug && slug !== post.slug) {
      slug = await this.generateUniqueSlug(connection, slug);
    }

    const updated = await this.postsRepository.update(connection, id, {
      ...updatePostDto,
      slug: slug || post.slug,
      scheduledAt:
        updatePostDto.status === "scheduled" && updatePostDto.scheduledAt
          ? new Date(updatePostDto.scheduledAt)
          : undefined,
    });

    if (updated && tenant && updated.status === "published") {
      await this.feedService.syncPostToFeed(
        tenant["_id"] ? (tenant["_id"] as unknown as string).toString() : (tenant as unknown as { id: string }).id,
        tenant.slug,
        tenant.name,
        updated.authorUsername,
        updated,
      );
      await this.ingestPost(updated, tenant);
    }

    return updated!;
  }

  async delete(connection: Connection, id: string): Promise<PostDocument> {
    const updated = await this.postsRepository.update(connection, id, {
      deletedAt: new Date(),
    });
    if (!updated) throw new NotFoundException("Post not found");

    const tId = updated.tenantId ? updated.tenantId.toString() : "";
    const pId = updated._id ? updated._id.toString() : updated.id;

    if (tId && pId) {
      await this.feedService.deletePostFromFeed(tId, pId, updated.tags);
    }

    return updated;
  }

  async restore(connection: Connection, id: string, tenant?: Tenant): Promise<PostDocument> {
    const updated = await this.postsRepository.restore(connection, id);
    if (!updated) throw new NotFoundException("Post not found");

    if (updated.status === "published" && (updated.tenantId || tenant)) {
      const tId = tenant
        ? (tenant["_id"] as unknown as string)?.toString() || (tenant as unknown as { id: string }).id
        : updated.tenantId?.toString();
      const tSlug = tenant?.slug || "";
      const tName = tenant?.name || "";

      await this.feedService.syncPostToFeed(tId, tSlug, tName, updated.authorUsername || "", updated);
    }

    return updated;
  }

  private async generateUniqueSlug(connection: Connection, baseText: string): Promise<string> {
    const baseSlug = slugify(baseText, { lower: true, strict: true });
    let slug = baseSlug;

    // Check if initial slug is reserved
    if (RESERVED_POST_SLUGS.includes(slug.toLowerCase())) {
      slug = `${baseSlug}-1`;
    }

    let counter = 1;

    while (await this.postsRepository.findOne(connection, { slug })) {
      slug = `${baseSlug}-${counter + 1}`;
      counter++;
    }
    return slug;
  }
  async findScheduledPostsDue(connection: Connection): Promise<PostDocument[]> {
    return this.postsRepository.findAll(connection, {
      status: "scheduled",
      scheduledAt: { $lte: new Date() },
      deletedAt: { $exists: false },
    });
  }

  async publishScheduledPost(connection: Connection, post: PostDocument, tenant: Tenant): Promise<void> {
    const updated = await this.postsRepository.update(connection, post.id, {
      status: "published",
      publishedAt: new Date(),
      scheduledAt: undefined,
    });

    if (updated) {
      await this.feedService.syncPostToFeed(
        tenant["_id"] ? (tenant["_id"] as unknown as string).toString() : (tenant as unknown as { id: string }).id,
        tenant.slug,
        tenant.name,
        updated.authorUsername,
        updated,
      );
    }
  }

  async countByAuthor(connection: Connection, authorId: string, status: string = "published"): Promise<number> {
    return this.postsRepository.count(connection, {
      authorId,
      status,
      deletedAt: { $exists: false },
    });
  }

  async getCounts(connection: Connection, authorId: string) {
    const [published, drafts, scheduled, deleted] = await Promise.all([
      this.postsRepository.count(connection, { authorId, status: "published", deletedAt: { $exists: false } }),
      this.postsRepository.count(connection, { authorId, status: "draft", deletedAt: { $exists: false } }),
      this.postsRepository.count(connection, { authorId, status: "scheduled", deletedAt: { $exists: false } }),
      this.postsRepository.count(connection, { authorId, deletedAt: { $exists: true } }),
    ]);

    return {
      published,
      drafts,
      scheduled,
      deleted,
      unlisted: 0,
    };
  }

  async updateEnrichments(
    connection: Connection,
    id: string,
    enrichments: {
      summary?: string;
      entities?: string[];
      keyConcepts?: string[];
      language?: string;
    },
  ): Promise<PostDocument | null> {
    return this.postsRepository.update(connection, id, enrichments);
  }

  private async ingestPost(post: PostDocument | null, tenant?: Tenant) {
    if (!post || post.status !== "published") return;

    const tenantSlug = tenant?.slug || "conduit";
    const tenantName = tenant?.name || "Conduit";

    const postUrl = `https://${tenantSlug}.octanebrew.dev/${post.slug}`;

    this.semanticSearchService
      .ingestEntity(
        "blog_post",
        post["_id"]?.toString() || post.id,
        {
          title: post.title,
          text: this.parseTiptapToText(post.content),
          url: postUrl,
        },
        {
          slug: post.slug,
          authorName: post.authorName,
          authorUsername: post.authorUsername,
          authorId: post.authorId,
          tenantName: tenantName,
          tenantSlug: tenantSlug,
          tags: post.tags || [],
          status: post.status,
          publishedAt: post.publishedAt,
          featuredImage: post.featuredImage,
        },
        this.semanticSearchService.getTenantIndex(post.tenantId.toString()),
      )
      .catch(() => {});
  }

  private parseTiptapToText(node: TiptapNode | TiptapContent): string {
    if (!node) return "";
    if ("text" in node && node.text) return node.text;
    if (node.content && Array.isArray(node.content)) {
      const joinChar = node.type === "doc" ? "\n" : " ";
      return node.content.map(child => this.parseTiptapToText(child)).join(joinChar);
    }
    return "";
  }
}
