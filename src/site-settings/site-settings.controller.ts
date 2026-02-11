import { Controller, Get, Patch, Body, Req, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { Connection } from "mongoose";
import { SiteSettingsService } from "./site-settings.service";
import { UpdateSiteSettingsDto } from "./dto/update-site-settings.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("site-settings")
@Controller("site-settings")
export class SiteSettingsController {
  constructor(private readonly service: SiteSettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get public site settings" })
  async getSettings(@Req() req: Request) {
    const connection = req["tenantConnection"] as Connection;
    if (!connection) throw new BadRequestException("Tenant context required");
    return this.service.getSettings(connection);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update site settings (Admin/Owner only)" })
  async updateSettings(@Req() req: Request, @Body() dto: UpdateSiteSettingsDto) {
    const connection = req["tenantConnection"] as Connection;
    return this.service.updateSettings(connection, dto);
  }
}
