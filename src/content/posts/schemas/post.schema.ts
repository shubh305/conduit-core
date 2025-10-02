import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type PostDocument = Post & Document;

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

export interface TiptapContent {
  type: "doc";
  content: TiptapNode[];
}

@Schema({ collection: "posts", timestamps: true })
export class Post {
  @Prop({ required: true, index: true, unique: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: TiptapContent;

  @Prop()
  excerpt?: string;

  @Prop()
  featuredImage?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  featuredImageAttribution?: { name: string; url: string };

  @Prop({ type: [String], index: true })
  tags: string[];

  @Prop({
    type: String,
    enum: ["draft", "published", "scheduled", "archived"],
    default: "draft",
    index: true,
  })
  status: string;

  @Prop({ index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true })
  authorUsername: string;

  @Prop()
  authorAvatar?: string;

  @Prop()
  publishedAt?: Date;

  @Prop()
  scheduledAt?: Date;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ default: 0 })
  readingTimeMinutes: number;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ default: 0 })
  paragraphsCount: number;

  @Prop({ type: [String], default: [], index: true })
  likedBy: string[];

  @Prop({ type: Date, index: true })
  deletedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
