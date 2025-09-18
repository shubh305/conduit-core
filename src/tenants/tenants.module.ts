import { Module, Global } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TenantsService } from "./tenants.service";
import { TenantsController } from "./tenants.controller";
import { TenantsRepository } from "./tenants.repository";
import { Tenant, TenantSchema } from "./schemas/tenant.schema";
import { UsersModule } from "../users/users.module";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    UsersModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository],
  exports: [TenantsService, TenantsRepository],
})
export class TenantsModule {}
