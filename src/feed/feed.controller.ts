import { Controller, Get, Query, Req, UseGuards, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { FeedService } from "./feed.service";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { Connection, Types } from "mongoose";

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

import { UsersService } from "../users/users.service";

@ApiTags("feed")
@Controller("feed")
export class FeedController {
  private readonly logger = new Logger(FeedController.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get global discovery feed" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "tag", required: false })
  @ApiQuery({ name: "type", required: false, enum: ["global", "following"] })
  @ApiQuery({ name: "ids", required: false, isArray: true, type: String })
  async getFeed(
    @Req() req: AuthenticatedRequest,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
    @Query("tag") tag?: string,
    @Query("type") type: string = "global",
    @Query("ids") ids?: string | string[],
  ) {
    const user = req.user;
    const idsArray = ids ? (Array.isArray(ids) ? ids : [ids]) : undefined;
    let followingIds: string[] = [];

    if (user) {
      const fullUser = await this.usersService.findByIdWithFollowing(req.tenantConnection, user.id);
      if (fullUser && fullUser.following) {
        const following = fullUser.following as unknown as { _id: Types.ObjectId; username: string }[];
        followingIds = following.filter(u => !!u).map(u => (u._id || u).toString());
        if (type === "following" && followingIds.length === 0) {
          return { data: [], meta: { total: 0, page, limit } };
        }
      } else if (type === "following") {
        return { data: [], meta: { total: 0, page, limit } };
      }
    } else if (type === "following") {
      return { data: [], meta: { total: 0, page, limit } };
    }

    const feed = await this.feedService.getGlobalFeed(
      +page,
      +limit,
      tag,
      idsArray,
      undefined,
      type === "following" ? followingIds : undefined,
    );

    const mappedFeed = feed.map(item => {
      const i = item.toObject ? item.toObject() : item;
      const isFollowing = user ? followingIds.includes(i.authorId?.toString()) : false;

      return {
        ...i,
        isLiked: user ? (i.likedBy || []).includes(user.id) : false,
        isFollowing,
      };
    });

    return { data: mappedFeed, meta: { total: feed.length, page, limit } };
  }
}
