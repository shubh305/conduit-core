import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiHeader, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SignupDto, LoginDto } from "./dto/auth.dto";
import { Request } from "express";
import { Connection } from "mongoose";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

@ApiTags("auth")
@ApiHeader({
  name: "x-tenant-id",
  description: "Tenant ID",
  required: true,
})
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Req() req: Request, @Body() dto: SignupDto) {
    const connection = req["tenantConnection"] as Connection;
    const tenant = req["tenant"];

    if (!connection || !tenant) {
      throw new BadRequestException("Tenant context required");
    }

    return this.authService.signup(connection, tenant._id.toString(), dto);
  }

  @Post("login")
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    const connection = req["tenantConnection"] as Connection;
    const tenant = req["tenant"];

    if (!connection || !tenant) {
      throw new BadRequestException("Tenant context required");
    }

    return this.authService.login(connection, tenant._id.toString(), dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
