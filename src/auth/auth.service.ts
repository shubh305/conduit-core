import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Connection } from "mongoose";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { SignupDto, LoginDto } from "./dto/auth.dto";
import { UserDocument } from "../users/schemas/user.schema";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(connection: Connection, tenantId: string, dto: SignupDto) {
    const existingEmail = await this.usersService.findByEmail(connection, dto.email);
    if (existingEmail) throw new ConflictException("Email already exists");

    const existingUser = await this.usersService.findByUsername(connection, dto.username);
    if (existingUser) throw new ConflictException("Username already exists");

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create(connection, {
      ...dto,
      passwordHash: hashedPassword,
    });

    return this.generateTokens(user, tenantId);
  }

  async login(connection: Connection, tenantId: string, dto: LoginDto) {
    let user = await this.usersService.findByEmail(connection, dto.usernameOrEmail);
    if (!user) {
      user = await this.usersService.findByUsername(connection, dto.usernameOrEmail);
    }

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.generateTokens(user, tenantId);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
        tenantId: payload.tenantId,
      };

      const refreshExpiry = this.configService.get<string>("JWT_REFRESH_EXPIRY") || "7d";

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: refreshExpiry }),
      };
    } catch (e) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private generateTokens(user: UserDocument, tenantId: string) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      tenantId: tenantId,
    };

    const refreshExpiry = this.configService.get<string>("JWT_REFRESH_EXPIRY") || "7d";

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: refreshExpiry }),
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        tenantId: tenantId,
      },
    };
  }
}
