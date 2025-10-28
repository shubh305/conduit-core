import { Injectable, Inject, OnModuleInit, Logger } from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { lastValueFrom, Observable } from "rxjs";

interface StorageGrpcService {
  uploadImage(data: {
    filename: string;
    data: Uint8Array | Buffer;
    bucket: string;
    mimeType: string;
  }): Observable<{ url: string }>;

  getPresignedUrl(data: {
    bucket: string;
    key: string;
    expiry?: number;
  }): Observable<{ url: string }>;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private storageGrpcService: StorageGrpcService;
  private readonly logger = new Logger(StorageService.name);

  constructor(@Inject("STORAGE_PACKAGE") private client: ClientGrpc) {}

  onModuleInit() {
    this.storageGrpcService =
      this.client.getService<StorageGrpcService>("StorageService");
  }

  async uploadImage(
    filename: string,
    buffer: Buffer,
    bucket: string = "images",
    mimeType: string = "image/jpeg",
  ): Promise<string> {
    try {
      this.logger.log(`Uploading ${filename} to bucket ${bucket}...`);
      const response = await lastValueFrom(
        this.storageGrpcService.uploadImage({
          filename,
          data: buffer,
          bucket,
          mimeType,
        }),
      );
      this.logger.log(`Upload successful: ${response.url}`);
      return response.url;
    } catch (error) {
      this.logger.error(`Upload failed: ${error}`);
      throw error;
    }
  }
}
