import { IsString, IsOptional, IsArray, IsBoolean, ValidateNested, IsUrl, Matches } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

class NavLinkDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  url: string;
}

class SocialLinksDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  website?: string;
}

class LayoutConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  showHero?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  density?: string;
}

export class UpdateSiteSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  favicon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-F]{3}){1,2}$/i, {
    message: "Must be a valid hex color code",
  })
  brandColor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiProperty({ enum: ["light", "dark", "system"], required: false })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({ type: [NavLinkDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavLinkDto)
  navLinks?: NavLinkDto[];

  @ApiProperty({ type: SocialLinksDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiProperty({ type: LayoutConfigDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutConfigDto)
  layout?: LayoutConfigDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  ogImage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  likesEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requireLoginToComment?: boolean;
}
