import { Controller, Get, Query, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CatalystService } from "./catalyst.service";

@ApiTags("editor/catalyst")
@Controller("editor/catalyst")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CatalystController {
  constructor(private readonly catalystService: CatalystService) {}

  @Get("cars/search")
  @ApiOperation({ summary: "Search cars via Catalyst" })
  @ApiQuery({ name: "q", required: true })
  async searchCars(@Query("q") query: string) {
    if (!query || query.length < 2) return [];
    return this.catalystService.searchCars(query);
  }

  @Get("bikes/search")
  @ApiOperation({ summary: "Search bikes via Catalyst" })
  @ApiQuery({ name: "q", required: true })
  async searchBikes(@Query("q") query: string) {
    if (!query || query.length < 2) return [];
    return this.catalystService.searchBikes(query);
  }

  @Get("books/search")
  @ApiOperation({ summary: "Search books via Catalyst" })
  @ApiQuery({ name: "q", required: true })
  @ApiQuery({ name: "year_from", required: false })
  @ApiQuery({ name: "year_to", required: false })
  async searchBooks(
    @Query("q") query: string,
    @Query("year_from") yearFrom?: string,
    @Query("year_to") yearTo?: string,
  ) {
    if (!query || query.length < 2) return [];
    return this.catalystService.searchBooks(query, yearFrom, yearTo);
  }

  @Get("mobiles/search")
  @ApiOperation({ summary: "Search mobiles via Catalyst" })
  @ApiQuery({ name: "q", required: true })
  async searchMobiles(@Query("q") query: string) {
    if (!query || query.length < 2) return [];
    return this.catalystService.searchMobiles(query);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Get full product details via Catalyst" })
  @ApiParam({ name: "id", required: true })
  async getProduct(@Param("id") id: string) {
    return this.catalystService.getProduct(id);
  }
}
