import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CommentDocument = Comment & Document;

@Schema({ collection: "comments", timestamps: true })
export class Comment {
  @Prop({ required: true, index: true })
  postId: string;

  @Prop({ required: true, index: true })
  authorId: string;

  @Prop({ required: true })
  authorName: string;

  @Prop()
  authorAvatar?: string;

  @Prop({ required: true })
  text: string;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ type: [String], default: [], index: true })
  likedBy: string[];

  @Prop({ index: true })
  parentId?: string;

  @Prop()
  deletedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
