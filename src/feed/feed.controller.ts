import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { FeedService } from "./feed.service";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { Connection } from "mongoose";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    tenantId: string;
  };
  tenantConnection: Connection;
}

@ApiTags("feed")
@Controller("feed")
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get global discovery feed" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "tag", required: false })
  @ApiQuery({ name: "ids", required: false, isArray: true, type: String })
  async getFeed(
    @Req() req: Request,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("tag") tag?: string,
    @Query("ids") ids?: string | string[],
  ) {
    const user = req.user as AuthenticatedRequest["user"];
    const idsArray = ids ? (Array.isArray(ids) ? ids : [ids]) : undefined;
    const feed = await this.feedService.getGlobalFeed(
      +page,
      +limit,
      tag,
      idsArray,
    );

    const mappedFeed = feed.map((item) => {
      const i = item.toObject ? item.toObject() : item;
      return {
        ...i,
        isLiked: user ? (i.likedBy || []).includes(user.id) : false,
      };
    });

    return { data: mappedFeed, meta: { total: feed.length, page, limit } };
  }
}
