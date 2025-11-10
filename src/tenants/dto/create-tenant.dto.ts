import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTenantDto {
  @ApiProperty({
    description: "Unique slug for the blog subdomain",
    example: "alice",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens",
  })
  slug: string;

  @ApiProperty({
    description: "Display name of the blog",
    example: "Alice's Blog",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, example: "My thoughts on tech" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: "classic" })
  @IsOptional()
  @IsEnum([
    "classic",
    "cyber",
    "sakura",
    "ronin",
    "octane",
    "journal",
    "techie",
    "professional",
    "terminal",
    "classic-white",
  ])
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;
}
