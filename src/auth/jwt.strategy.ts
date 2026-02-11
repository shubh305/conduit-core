import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { DatabaseService } from "../database/database.service";
import { JwtPayload, AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";

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
    public readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(req: AuthenticatedRequest, payload: TokenPayload): Promise<JwtPayload> {
    // Use the user's tenant from the JWT payload, not the request's tenant
    // This allows users to view posts from other tenants while staying authenticated
    const prefix = this.configService.get<string>("TENANT_DB_PREFIX") || "conduit_tenant_";
    const userTenantDbName = `${prefix}${payload.tenantId}`;
    const userTenantConnection = await this.databaseService.getTenantConnection(userTenantDbName);

    const user = await this.usersService.findById(userTenantConnection, payload.sub);

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
      return null;
    }
    throw new UnauthorizedException("User not found or inactive");
  }
}
