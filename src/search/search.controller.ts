import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { Connection } from "mongoose";
import { SearchService } from "./search.service";

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("suggest")
  @ApiOperation({ summary: "Get search suggestions" })
  @ApiQuery({ name: "q", required: true })
  async suggest(@Req() req: Request, @Query("q") query: string) {
    const connection = req["tenantConnection"] as Connection;
    return this.searchService.suggest(connection, query);
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
