import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ApiProperty } from "@nestjs/swagger";

export type ReadingListDocument = ReadingList & Document;

@Schema({ _id: false })
export class ReadingListItem {
  @Prop({ required: true })
  postId: string;

  @Prop({ default: Date.now })
  addedAt: Date;
}

@Schema({ collection: "reading_lists", timestamps: true })
export class ReadingList {
  @ApiProperty({ example: "My Favorite Posts" })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: "A collection of posts I love", required: false })
  @Prop()
  description?: string;

  @ApiProperty({ example: true, default: true })
  @Prop({ default: true })
  isPrivate: boolean;

  @ApiProperty({ example: "user_123" })
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: [SchemaFactory.createForClass(ReadingListItem)], default: [] })
  items: ReadingListItem[];

  @Prop({ default: false })
  isSystem?: boolean;
}

export const ReadingListSchema = SchemaFactory.createForClass(ReadingList);
ReadingListSchema.index({ userId: 1, name: 1 }, { unique: true });
