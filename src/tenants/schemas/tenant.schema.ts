import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TenantDocument = Tenant & Document;

@Schema({ collection: "tenants", timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ unique: true, sparse: true, index: true })
  customDomain?: string;

  @Prop({ default: false })
  customDomainVerified: boolean;

  @Prop({
    type: String,
    enum: [
      "classic",
      "cyber",
      "sakura",
      "ronin",
      "octane",
      "journal",
      "techie",
      "professional",
      "terminal",
      "noir",
    ],
    default: "classic",
  })
  theme: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  logo?: string;

  @Prop({ required: true })
  ownerUserId: string;

  @Prop({ required: true, index: true })
  ownerUsername: string;

  @Prop({ required: true })
  databaseName: string;

  @Prop({
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active",
  })
  status: string;

  @Prop({ type: String, enum: ["free", "pro", "enterprise"], default: "free" })
  plan: string;

  @Prop()
  deletedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
