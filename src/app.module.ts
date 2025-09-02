import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import * as Joi from "joi";
import { DatabaseModule } from "./database/database.module";
import { TenantsModule } from "./tenants/tenants.module";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { FeedModule } from "./feed/feed.module";
import { SiteSettingsModule } from "./site-settings/site-settings.module";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";
import { StorageModule } from "./storage/storage.module";
import { SearchModule } from "./search/search.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "test", "provision")
          .default("development"),
        PORT: Joi.number().default(4000),
        API_PREFIX: Joi.string().default("api"),
        MONGO_URI: Joi.string().required(),
        MONGO_DB_NAME: Joi.string().default("conduit_master"),
        JWT_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRY: Joi.string().default("2h"),
        JWT_REFRESH_EXPIRY: Joi.string().default("7d"),
        UNSPLASH_ACCESS_KEY: Joi.string().optional(),
        UNSPLASH_API_URL: Joi.string().default("https://api.unsplash.com"),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>("MONGO_URI");
        return {
          uri,
          dbName: configService.get<string>("MONGO_DB_NAME"),
        };
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    TenantsModule,
    AuthModule,
    ContentModule,
    FeedModule,
    SiteSettingsModule,
    StorageModule,
    SearchModule,
    SchedulerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
