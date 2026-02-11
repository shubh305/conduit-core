import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type UserDocument = User & Document;

@Schema({ collection: "users", timestamps: true })
export class User {
  @ApiProperty({ example: "user@example.com" })
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @ApiProperty({ example: "johndoe" })
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @ApiProperty({ example: "John Doe" })
  @Prop({ required: true })
  displayName: string;

  @ApiPropertyOptional()
  @Prop()
  avatar?: string;

  @ApiPropertyOptional()
  @Prop()
  bio?: string;

  @ApiPropertyOptional()
  @Prop()
  tagline?: string;

  @ApiPropertyOptional()
  @Prop()
  location?: string;

  @ApiPropertyOptional({
    type: Object,
    example: { github: "https://github.com/...", twitter: "https://x.com/..." },
  })
  @Prop({ type: Object })
  socialLinks?: {
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    stackoverflow?: string;
    instagram?: string;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  following: Types.ObjectId[];

  @Prop({
    type: String,
    enum: ["owner", "admin", "author", "reader"],
    default: "reader",
  })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
