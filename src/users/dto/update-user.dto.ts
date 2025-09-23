import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject } from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({
    type: Object,
    example: { github: "https://github.com/...", twitter: "https://x.com/..." },
  })
  @IsObject()
  @IsOptional()
  socialLinks?: {
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    stackoverflow?: string;
    instagram?: string;
  };
}
