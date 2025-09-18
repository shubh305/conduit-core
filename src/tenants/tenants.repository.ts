import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Tenant, TenantDocument } from "./schemas/tenant.schema";

@Injectable()
export class TenantsRepository {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(tenant: Partial<Tenant>): Promise<TenantDocument> {
    const newTenant = new this.tenantModel(tenant);
    return newTenant.save();
  }

  async findById(id: string): Promise<TenantDocument | null> {
    return this.tenantModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ slug }).exec();
  }

  async findByOwner(ownerUserId: string): Promise<TenantDocument[]> {
    return this.tenantModel.find({ ownerUserId }).exec();
  }

  async findByOwnerUsername(
    ownerUsername: string,
  ): Promise<TenantDocument | null> {
    return this.tenantModel.findOne({ ownerUsername }).exec();
  }

  async findAll(): Promise<TenantDocument[]> {
    return this.tenantModel.find().exec();
  }

  async update(
    id: string,
    updateData: Partial<Tenant>,
  ): Promise<TenantDocument | null> {
    return this.tenantModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.tenantModel.findByIdAndDelete(id).exec();
  }
}
