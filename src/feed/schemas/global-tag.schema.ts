import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GlobalTagDocument = GlobalTag & Document;

@Schema({ collection: "global_tags", timestamps: true })
export class GlobalTag {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  postsCount: number;

  @Prop({ default: 0 })
  followersCount: number;
}

export const GlobalTagSchema = SchemaFactory.createForClass(GlobalTag);
