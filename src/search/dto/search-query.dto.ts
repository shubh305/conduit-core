import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from "class-validator";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum SearchSortBy {
  RELEVANCY = "relevancy",
  RECENCY = "recency",
  BALANCED = "balanced",
}

export class SemanticSearchQueryDto {
  @ApiPropertyOptional({ description: "Search query" })
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: "Number of results", default: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit?: number = 10;

  @ApiPropertyOptional({ description: "Enable AI query analysis", default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  enable_analysis?: boolean = true;

  @ApiPropertyOptional({ description: "Enable context-aware reranking", default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  enable_reranking?: boolean = false;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: SearchSortBy,
    default: SearchSortBy.RELEVANCY,
  })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sort_by?: SearchSortBy = SearchSortBy.RELEVANCY;
}
