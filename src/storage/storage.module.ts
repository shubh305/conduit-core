import { Module, Global } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { StorageService } from "./storage.service";
import { UnsplashService } from "./unsplash.service";
import { MediaController } from "./media.controller";
import { join } from "path";

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "STORAGE_PACKAGE",
        transport: Transport.GRPC,
        options: {
          package: "storage",
          protoPath: join(__dirname, "storage.proto"),
          url: process.env.STORAGE_SERVICE_URL || "localhost:50051",
        },
      },
    ]),
  ],
  controllers: [MediaController],
  providers: [StorageService, UnsplashService],
  exports: [StorageService, UnsplashService],
})
export class StorageModule {}
