import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UnsplashService {
  private readonly logger = new Logger(UnsplashService.name);
  private readonly accessKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.accessKey = this.configService.get<string>("UNSPLASH_ACCESS_KEY");
    this.baseUrl = this.configService.get<string>("UNSPLASH_API_URL") || "https://api.unsplash.com";
  }

  async searchPhotos(query: string, page = 1, perPage = 20) {
    if (!this.accessKey) {
      this.logger.warn("UNSPLASH_ACCESS_KEY is not configured");
      return { results: [], total: 0, total_pages: 0 };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
            "Accept-Version": "v1",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Unsplash API error: ${response.status} ${JSON.stringify(errorData)}`);
        throw new Error(`Unsplash API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to search Unsplash: ${error.message}`);
      throw new BadRequestException("Failed to search Unsplash");
    }
  }

  async trackDownload(downloadLocation: string) {
    if (!this.accessKey || !downloadLocation) return;

    try {
      await fetch(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
          "Accept-Version": "v1",
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track Unsplash download: ${error.message}`);
    }
  }
}
