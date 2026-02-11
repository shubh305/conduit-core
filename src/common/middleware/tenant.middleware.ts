import { Injectable, NestMiddleware, BadRequestException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TenantsService } from "../../tenants/tenants.service";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly databaseService: DatabaseService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers["x-tenant-id"] as string;

    if (!tenantId) {
      return next();
    }

    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant) {
      throw new BadRequestException("Invalid tenant ID");
    }

    if (tenant.status !== "active") {
      throw new BadRequestException("Tenant is not active");
    }

    const tenantConnection = await this.databaseService.getTenantConnection(tenant.databaseName);

    req["tenant"] = tenant;
    req["tenantConnection"] = tenantConnection;

    next();
  }
}
