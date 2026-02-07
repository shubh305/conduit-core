import { Controller, Post, Body, Get, Param, Query, BadRequestException, UseGuards, Req, Delete } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { TenantsService } from "./tenants.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";

@ApiTags("tenants")
@Controller("tenants")
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new tenant (blog)" })
  @ApiResponse({ status: 201, description: "Tenant created successfully" })
  async create(@Req() req: AuthenticatedRequest, @Body() createTenantDto: CreateTenantDto) {
    const userId = req.user.id;
    const username = req.user.username;
    const tenant = await this.tenantsService.create(createTenantDto, userId, username);
    return { tenant };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get tenants owned by current user" })
  async getMyTenants(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.findByOwner(req.user.id);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get tenants owned by a specific user" })
  async getTenantsByUser(@Param("userId") userId: string) {
    return this.tenantsService.findByOwner(userId);
  }

  @Get("check-slug")
  @ApiOperation({ summary: "Check if a tenant slug is available" })
  async checkSlug(@Query("slug") slug: string) {
    if (!slug) throw new BadRequestException("Slug is required");
    const available = await this.tenantsService.isSlugAvailable(slug);
    return { slug, available };
  }

  @Get(":slug")
  @ApiOperation({ summary: "Find tenant by slug or owner username" })
  async findBySlug(@Param("slug") slug: string) {
    let tenant = await this.tenantsService.findBySlug(slug);

    if (!tenant) {
      tenant = await this.tenantsService.findByOwnerUsername(slug);
    }

    if (!tenant) throw new BadRequestException("Tenant not found");
    return tenant;
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a tenant (blog)" })
  async delete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    await this.tenantsService.delete(id, req.user.id);
    return { success: true };
  }
}
