import { Controller, Get, Query, Req, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { Connection } from "mongoose";
import { SearchService } from "./search.service";
import { SemanticSearchService } from "./semantic-search.service";

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
  @ApiQuery({ name: "q", required: true })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async semanticSearch(@Req() req: Request, @Query("q") query: string, @Query("limit") limit?: number) {
    const indexName = this.semanticSearchService.getSearchAlias();
    return this.semanticSearchService.search(query, limit, { indexName, minScore: 0.5, useHybrid: true });
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
