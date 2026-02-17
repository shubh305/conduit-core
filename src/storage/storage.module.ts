import { Module, Global } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { StorageService } from "./storage.service";
import { UnsplashService } from "./unsplash.service";
import { MediaController } from "./media.controller";
import { join } from "path";

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: "STORAGE_PACKAGE",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: "storage",
            protoPath: join(__dirname, "storage.proto"),
            url: configService.get<string>("STORAGE_SERVICE_URL"),
            loader: {
              keepCase: true,
            },
            maxSendMessageLength: 1024 * 1024 * 1024,
            maxReceiveMessageLength: 1024 * 1024 * 1024,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MediaController],
  providers: [StorageService, UnsplashService],
  exports: [StorageService, UnsplashService],
})
export class StorageModule {}
