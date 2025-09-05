import { Request } from "express";
import { Connection } from "mongoose";
import { TenantDocument } from "../../tenants/schemas/tenant.schema";

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  tenantId: string;
  bio?: string;
  avatar?: string;
  tagline?: string;
  location?: string;
  socialLinks?: Record<string, string>;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  tenantConnection: Connection;
  tenant?: TenantDocument;
}
