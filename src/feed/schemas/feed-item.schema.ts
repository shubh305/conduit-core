import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type FeedItemDocument = FeedItem & Document;

@Schema({ collection: "global_feed", timestamps: true })
export class FeedItem {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  tenantSlug: string;

  @Prop({ required: true })
  tenantName: string;

  @Prop({ required: true, index: true })
  postId: string;

  @Prop({ required: true })
  postSlug: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  excerpt?: string;

  @Prop()
  featuredImage?: string;

  @Prop({ type: Object })
  featuredImageAttribution?: { name: string; url: string };

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ required: true })
  authorUsername: string;

  @Prop()
  authorAvatar?: string;

  @Prop({ type: [String], index: true })
  tags: string[];

  @Prop({ required: true, index: true })
  publishedAt: Date;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ type: [String], index: true, default: [] })
  likedBy: string[];

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0, index: true })
  hotScore: number;
}

export const FeedItemSchema = SchemaFactory.createForClass(FeedItem);
