import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>("NODE_ENV");
  const bodyLimit = configService.get<string>("BODY_LIMIT") || "50mb";

  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  if (nodeEnv === "development") {
    app.use((req, res, next) => {
      console.log(`[Request] ${req.method} ${req.url}`);
      next();
    });
  }

  const port = configService.get<number>("PORT") || 4000;
  const apiPrefix = configService.get<string>("API_PREFIX") || "api";
  const corsOrigins = configService.get<string>("CORS_ORIGINS")
    ? configService.get<string>("CORS_ORIGINS").split(",")
    : ["http://localhost:3000"];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Project Conduit API")
    .setDescription(
      "Backend API for Project Conduit multi-tenant publishing platform",
    )
    .setVersion("0.0.1")
    .addBearerAuth()
    .addApiKey(
      {
        type: "apiKey",
        name: "x-tenant-id",
        in: "header",
        description: "Tenant ID",
      },
      "x-tenant-id",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(port);
}
bootstrap();
