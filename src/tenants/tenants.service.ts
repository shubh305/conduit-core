import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Types, Connection } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";
import { TenantsRepository } from "./tenants.repository";
import { TenantDocument } from "./schemas/tenant.schema";
import { DatabaseService } from "../database/database.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { FeedRepository } from "../feed/feed.repository";
import { UsersService } from "../users/users.service";

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly databaseService: DatabaseService,
    private readonly feedRepository: FeedRepository,
    private readonly usersService: UsersService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(createTenantDto: CreateTenantDto, ownerUserId: string, ownerUsername?: string): Promise<TenantDocument> {
    this.logger.log(`Creating tenant with slug: ${createTenantDto.slug} for owner: ${ownerUsername} (${ownerUserId})`);
    const existing = await this.tenantsRepository.findBySlug(createTenantDto.slug);
    if (existing) {
      throw new BadRequestException("Tenant slug already taken");
    }

    let finalOwnerUsername = ownerUsername;
    if (!finalOwnerUsername) {
      const user = await this.usersService.findById(this.connection, ownerUserId);
      if (!user) throw new BadRequestException("Owner user not found");
      finalOwnerUsername = user.username;
    }

    const tenantId = new Types.ObjectId();
    const databaseName = this.databaseService.getTenantDatabaseName(tenantId.toString());

    const tenant = await this.tenantsRepository.create({
      ...createTenantDto,
      ownerUserId,
      ownerUsername: finalOwnerUsername,
      databaseName,
      status: "active",
      plan: "free",
      _id: tenantId,
    } as unknown as TenantDocument);

    await this.databaseService.createTenantDatabase(tenantId.toString());

    return tenant;
  }

  async findById(id: string): Promise<TenantDocument | null> {
    return this.tenantsRepository.findById(id);
  }

  async findBySlug(slug: string): Promise<TenantDocument | null> {
    return this.tenantsRepository.findBySlug(slug);
  }

  async findByOwnerUsername(username: string): Promise<TenantDocument | null> {
    return this.tenantsRepository.findByOwnerUsername(username);
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await this.findBySlug(slug);
    return !existing;
  }

  async findByOwner(ownerUserId: string): Promise<TenantDocument[]> {
    return this.tenantsRepository.findByOwner(ownerUserId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new BadRequestException("Tenant not found");
    }

    if (tenant.ownerUserId !== userId) {
      throw new BadRequestException("Not authorized to delete this tenant");
    }

    await this.feedRepository.deleteByTenant(id);

    try {
      if (tenant["_id"]) {
        await this.databaseService.dropTenantDatabase(tenant["_id"].toString());
      } else {
        await this.databaseService.dropTenantDatabase(id);
      }
    } catch (e) {
      this.logger.error(`Failed to drop database for tenant ${id}`, e.message);
    }

    await this.tenantsRepository.delete(id);
  }
}
