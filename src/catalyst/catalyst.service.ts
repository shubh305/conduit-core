import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

@Injectable()
export class CatalystService {
  private readonly logger = new Logger(CatalystService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>("CATALYST_URL");
    this.apiKey = this.configService.get<string>("SHARED_API_KEY");
  }

  private get headers() {
    return { "X-API-KEY": this.apiKey };
  }

  async searchCars(query: string) {
    return this.request("GET", `/cars/search?q=${encodeURIComponent(query)}`);
  }

  async searchBikes(query: string) {
    return this.request("GET", `/bikes/search?q=${encodeURIComponent(query)}`);
  }

  async searchBooks(query: string, yearFrom?: string, yearTo?: string) {
    let url = `/books/search?q=${encodeURIComponent(query)}`;
    if (yearFrom) url += `&year_from=${yearFrom}`;
    if (yearTo) url += `&year_to=${yearTo}`;
    return this.request("GET", url);
  }

  async searchMobiles(query: string) {
    return this.request("GET", `/mobiles/search?q=${encodeURIComponent(query)}`);
  }

  async getProduct(id: string) {
    return this.request("GET", `/products/${id}`);
  }

  private async request(method: string, endpoint: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.baseUrl}${endpoint}`,
          headers: this.headers,
        }),
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.code === "ECONNREFUSED" || !error.response || error.response.status >= 500) {
          throw new HttpException({ error: "catalog_unavailable" }, HttpStatus.SERVICE_UNAVAILABLE);
        }
        throw new HttpException(error.response.data, error.response.status);
      }
      this.logger.error("Unexpected error calling Catalyst API", error);
      throw new HttpException("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
