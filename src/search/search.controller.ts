import { Controller, Get, Query, Req, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { Connection } from "mongoose";
import { SearchService } from "./search.service";
import { SemanticSearchService } from "./semantic-search.service";
import { SemanticSearchQueryDto } from "./dto/search-query.dto";

@ApiTags("search")
@Controller("search")
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly semanticSearchService: SemanticSearchService,
  ) {}

  @Get("suggest")
  @ApiOperation({ summary: "Get search suggestions" })
  @ApiQuery({ name: "q", required: true })
  async suggest(@Req() req: Request, @Query("q") query: string) {
    const connection = req["tenantConnection"] as Connection;
    return this.searchService.suggest(connection, query);
  }

  @Get("semantic")
  @ApiOperation({ summary: "Semantic search" })
  async semanticSearch(@Req() req: Request, @Query() queryDto: SemanticSearchQueryDto) {
    const indexName = this.semanticSearchService.getSearchAlias();
    return this.semanticSearchService.search(queryDto.q, queryDto.limit, {
      indexName,
      minScore: 25.0,
      useHybrid: true,
      enableQueryAnalysis: queryDto.enable_analysis,
      enableReranking: queryDto.enable_reranking,
      sortBy: queryDto.sort_by,
    });
  }

  @Get()
  @ApiOperation({ summary: "Global search" })
  @ApiQuery({ name: "q", required: true })
  async search(@Req() req: Request, @Query("q") query: string) {
    const connection = req["tenantConnection"] as Connection;
    if (!query) {
      return { results: { users: [], posts: [], tags: [] } };
    }
    return this.searchService.search(connection, query);
  }
}
