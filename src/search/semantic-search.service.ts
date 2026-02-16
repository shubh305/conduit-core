import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

export type EntityType = "blog_post" | "user" | "blog";

export interface SearchOptions {
  filters?: Record<string, unknown>;
  indexName?: string;
  useHybrid?: boolean;
  minScore?: number;
  vectorThreshold?: number;
  returnChunks?: boolean;
  enableQueryAnalysis?: boolean;
  enableQueryExpansion?: boolean;
  enableReranking?: boolean;
  sortBy?: "relevancy" | "recency" | "balanced";
}

export interface RawSemanticResult {
  entity_id: string;
  title?: string;
  content?: string;
  matched_chunk?: string;
  score: number;
  rerank_score?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private readonly ingestionSvcUrl: string;
  private readonly apiKey: string;
  private readonly masterIndex: string;
  private readonly searchAlias: string;
  private readonly tenantIndexPrefix: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.ingestionSvcUrl = this.configService.get<string>("INGESTION_SVC_URL", "");
    this.apiKey = this.configService.get<string>("SHARED_API_KEY", "");
    this.masterIndex = this.configService.get<string>("SEARCH_MASTER_INDEX", "");
    this.searchAlias = this.configService.get<string>("SEARCH_GLOBAL_ALIAS", "");
    this.tenantIndexPrefix = this.configService.get<string>("SEARCH_TENANT_INDEX_PREFIX", "");
  }

  getTenantIndex(tenantId: string): string {
    return `${this.tenantIndexPrefix}${tenantId}`;
  }

  getMasterIndex(): string {
    return this.masterIndex;
  }

  getSearchAlias(): string {
    return this.searchAlias;
  }

  async ingestEntity(
    entityType: EntityType,
    entityId: string,
    payload: Record<string, unknown>,
    metadata: Record<string, unknown> = {},
    indexName?: string,
  ) {
    try {
      const traceId = `blog-${entityType}-${entityId}-${Date.now()}`;

      const requestPayload = {
        trace_id: traceId,
        source_app: "conduit",
        entity_id: entityId,
        entity_type: entityType,
        index_name: indexName || this.masterIndex,
        operation: "index",
        timestamp: new Date().toISOString(),
        chunking_strategy: entityType === "blog_post" ? "semantic" : "recursive",
        chunk_size: 300,
        chunk_overlap: 50,
        payload: {
          ...payload,
          metadata: {
            ...metadata,
            entity_type: entityType,
          },
        },
        enrichments: ["summary", "vectors"],
      };

      this.logger.log(`Ingesting ${entityType} ${entityId} into index ${requestPayload.index_name}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.ingestionSvcUrl}/ingest`, requestPayload, {
          headers: {
            "X-API-KEY": this.apiKey,
            "Content-Type": "application/json",
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to ingest ${entityType} ${entityId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async search(query: string, limit: number = 5, options: SearchOptions = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.ingestionSvcUrl}/search`,
          {
            query,
            limit,
            filters: {
              ...options.filters,
              source_app: "conduit",
            },
            index_name: options.indexName || this.searchAlias,
            use_hybrid: options.useHybrid !== undefined ? options.useHybrid : true,
            min_score: options.minScore || 25.0,
            vector_threshold: options.vectorThreshold || 0.65,
            return_chunks: options.returnChunks !== undefined ? options.returnChunks : true,
            enable_query_analysis: true,
            enable_query_expansion: true,
            enable_reranking: false,
            sort_by: options.sortBy || "relevancy",
            debug: true,
          },
          {
            headers: {
              "X-API-KEY": this.apiKey,
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const rawResults = (response.data?.results || []) as RawSemanticResult[];
      const mappedResults = rawResults.map((item: RawSemanticResult) => {
        const meta = (item.metadata || {}) as Record<string, unknown>;
        return {
          postId: item.entity_id,
          postSlug: meta.slug as string,
          title: item.title || (meta.title as string) || "Untitled",
          excerpt: item.matched_chunk || item.content?.substring(0, 200) || "",
          featuredImage: meta.featuredImage as string,
          publishedAt: meta.publishedAt as string,
          authorName: (meta.authorName as string) || "Unknown",
          authorUsername: (meta.authorUsername as string) || "unknown",
          authorId: (meta.authorId as string) || "",
          tenantName: (meta.tenantName as string) || "Global",
          tenantSlug: (meta.tenantSlug as string) || "",
          tags: (meta.tags as string[]) || [],
          status: meta.status as string,
          isSemantic: true,
          score: item.score,
          rerankScore: item.rerank_score,
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isLiked: false,
          isFollowing: false,
        };
      });

      return { results: mappedResults };
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`, error.stack);
      return { results: [] };
    }
  }
}
