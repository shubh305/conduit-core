import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsObject, IsDateString, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { TiptapContent } from "../schemas/post.schema";

export class CreatePostDto {
  @ApiProperty({ example: "My First Post" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Tiptap JSON content" })
  @IsObject()
  @IsNotEmpty()
  content: TiptapContent;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  featuredImageAttribution?: { name: string; url: string };

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: ["draft", "published", "scheduled"], default: "draft" })
  @IsOptional()
  @IsEnum(["draft", "published", "scheduled"])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  publishedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  wordCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  paragraphsCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readingTimeMinutes?: number;
}

export class UpdatePostDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  content?: TiptapContent;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  featuredImageAttribution?: { name: string; url: string };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    required: false,
    enum: ["draft", "published", "scheduled", "archived"],
  })
  @IsOptional()
  @IsEnum(["draft", "published", "scheduled", "archived"])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  publishedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  wordCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  paragraphsCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  readingTimeMinutes?: number;
}
