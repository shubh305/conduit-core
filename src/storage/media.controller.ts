import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  UseGuards,
  Req,
  Get,
  Query,
  Body,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StorageService } from "./storage.service";
import { UnsplashService } from "./unsplash.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Request } from "express";

@ApiTags("media")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("media")
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly unsplashService: UnsplashService,
  ) {}

  @Get("unsplash/search")
  @ApiOperation({ summary: "Search photos on Unsplash" })
  async searchUnsplash(@Query("query") query: string, @Query("page") page: number) {
    return this.unsplashService.searchPhotos(query, page);
  }

  @Post("unsplash/track")
  @ApiOperation({ summary: "Track Unsplash photo download" })
  async trackUnsplash(@Body("downloadLocation") downloadLocation: string) {
    return this.unsplashService.trackDownload(downloadLocation);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOperation({ summary: "Upload an image" })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
      throw new BadRequestException("Only image files are allowed!");
    }

    const tenant = req["tenant"];
    const tenantId = tenant?.slug || "common";
    const bucket = `conduit-uploads`;
    const filename = `${tenantId}/${Date.now()}-${file.originalname}`;

    try {
      const url = await this.storageService.uploadImage(filename, file.buffer, bucket, file.mimetype);
      return {
        url,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException("Image upload failed");
    }
  }
}
