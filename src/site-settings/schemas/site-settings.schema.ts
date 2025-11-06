import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SiteSettingsDocument = SiteSettings & Document;

@Schema({ _id: false })
class NavLink {
  @Prop()
  label: string;
  @Prop()
  url: string;
}
const NavLinkSchema = SchemaFactory.createForClass(NavLink);

@Schema({ _id: false })
class SocialLinks {
  @Prop()
  twitter?: string;
  @Prop()
  github?: string;
  @Prop()
  linkedin?: string;
  @Prop()
  website?: string;
}
const SocialLinksSchema = SchemaFactory.createForClass(SocialLinks);

@Schema({ _id: false })
class LayoutConfig {
  @Prop({ default: "magazine" })
  mode?: string;
  @Prop({ default: true })
  showHero?: boolean;
  @Prop({ default: "comfortable" })
  density?: string;
}
const LayoutConfigSchema = SchemaFactory.createForClass(LayoutConfig);

@Schema({ collection: "site_settings", timestamps: true })
export class SiteSettings {
  @Prop({ required: true, unique: true })
  tenantId: string;

  @Prop()
  logo?: string;

  @Prop()
  favicon?: string;

  @Prop({ default: "#3182CE" })
  brandColor: string;

  @Prop({ default: "Inter" })
  fontFamily: string;

  @Prop({ type: String, enum: ["light", "dark", "system"], default: "light" })
  theme: string;

  @Prop({ type: [NavLinkSchema], default: [] })
  navLinks: NavLink[];

  @Prop({ type: SocialLinksSchema, default: {} })
  socialLinks: SocialLinks;

  @Prop({ type: LayoutConfigSchema, default: {} })
  layout: LayoutConfig;

  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop()
  ogImage?: string;

  @Prop({ default: true })
  commentsEnabled: boolean;

  @Prop({ default: true })
  likesEnabled: boolean;

  @Prop({ default: false })
  requireLoginToComment: boolean;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
