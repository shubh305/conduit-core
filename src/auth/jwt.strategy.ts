import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import {
  JwtPayload,
  AuthenticatedRequest,
} from "../common/interfaces/authenticated-request.interface";

interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(
    req: AuthenticatedRequest,
    payload: TokenPayload,
  ): Promise<JwtPayload> {
    const tenantConnection = req.tenantConnection;

    if (!tenantConnection) {
      this.logger.error("Missing tenantConnection");
      throw new UnauthorizedException(
        "Tenant context missing for auth validation",
      );
    }

    const user = await this.usersService.findById(
      tenantConnection,
      payload.sub,
    );

    if (user && user.isActive) {
      return {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        tagline: user.tagline,
        location: user.location,
        socialLinks: user.socialLinks,
        tenantId: payload.tenantId,
      };
    }

    const currentTenant = req.tenant;
    if (currentTenant && currentTenant.ownerUserId === payload.sub) {
      return {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        displayName: payload.username,
        role: "owner",
        tenantId: payload.tenantId,
      };
    }

    if (!user || !user.isActive) {
      this.logger.warn(`User validation failed for sub: ${payload.sub}`);
    }
    throw new UnauthorizedException("User not found or inactive");
  }
}
