import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { PostsService } from "./posts.service";
import { CreatePostDto, UpdatePostDto } from "./dto/post.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { AuthenticatedRequest } from "../../common/interfaces/authenticated-request.interface";
import { UsersService } from "../../users/users.service";
import { DatabaseService } from "../../database/database.service";
import { Types } from "mongoose";

@ApiTags("posts")
@ApiBearerAuth()
@Controller("posts")
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(
    private readonly postsService: PostsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly databaseService: DatabaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: "Create a new post" })
  async create(@Req() req: AuthenticatedRequest, @Body() createPostDto: CreatePostDto) {
    const connection = req.tenantConnection;
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant) throw new BadRequestException("Tenant context required");

    return this.postsService.create(connection, tenant, createPostDto, user.id, user.displayName, user.username);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "List all posts" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["published", "draft", "scheduled"],
  })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "author", required: false, type: String })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("author") authorId?: string,
    @Query("ids") ids?: string | string[],
  ) {
    const idsArray = ids ? (Array.isArray(ids) ? ids : [ids]) : undefined;
    const connection = req.tenantConnection;
    const tenant = req.tenant;
    const user = req.user;

    let safeStatus = status;
    let safeAuthorId = authorId;

    if (!user) {
      safeStatus = "published";
    } else {
      if (status && status !== "published") {
        safeAuthorId = user.id;
        safeStatus = status;
      }

      if (!status && !authorId) {
        safeStatus = "published";
      }
    }

    let result;
    if (search) {
      const data = await this.postsService.search(connection, search);

      const filteredData = data.filter(p =>
        !user ? p.status === "published" : p.status === "published" || p.authorId === user.id,
      );

      // Mock pagination for search for now
      result = {
        data: filteredData,
        meta: {
          page: 1,
          limit: 100,
          total: filteredData.length,
          totalPages: 1,
        },
      };
    } else {
      const tenantId = tenant?._id || tenant?.id;
      result = await this.postsService.findAll(
        connection,
        +page,
        +limit,
        safeStatus as "published" | "draft" | "scheduled",
        safeAuthorId,
        tenantId ? tenantId.toString() : undefined,
        idsArray,
      );
    }

    let followingIds: string[] = [];
    if (user) {
      const freshUser = await this.usersService.findByIdWithFollowing(connection, user.id);
      if (freshUser && freshUser.following) {
        followingIds = freshUser.following.map(id => id.toString());
      }
    }

    const mappedData = result.data.map(post => {
      const p = post.toObject ? post.toObject() : post;
      return {
        ...p,
        tenantId: p.tenantId || tenant?._id || tenant?.id,
        tenantSlug: p.tenantSlug || tenant?.slug,
        tenantName: p.tenantName || tenant?.name,
        postSlug: p.slug,
        isLiked: user ? (p.likedBy || []).includes(user.id) : false,
        isFollowing: user ? followingIds.includes(p.authorId?.toString()) : false,
      };
    });

    return { ...result, data: mappedData };
  }

  @UseGuards(JwtAuthGuard)
  @Get("counts")
  @ApiOperation({ summary: "Get post counts by status" })
  async getCounts(@Req() req: AuthenticatedRequest) {
    const connection = req.tenantConnection;
    const user = req.user;
    return this.postsService.getCounts(connection, user.id);
  }

  @Get(":idOrSlug")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get post by ID or Slug" })
  async findOne(@Req() req: AuthenticatedRequest, @Param("idOrSlug") idOrSlug: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    let post;

    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      try {
        post = await this.postsService.findOne(connection, idOrSlug);
      } catch (e) {
        post = await this.postsService.findBySlug(connection, idOrSlug);
      }
    } else {
      post = await this.postsService.findBySlug(connection, idOrSlug);
    }

    if (!post) return null;

    const p = post.toObject ? post.toObject() : post;
    let isFollowing = false;

    if (user && p.authorId) {
      // Get user's tenant connection to fetch their following list
      const userTenantDbName = this.databaseService.getTenantDatabaseName(user.tenantId);
      const userTenantConnection = await this.databaseService.getTenantConnection(userTenantDbName);

      const fullUser = await this.usersService.findByIdWithFollowing(userTenantConnection, user.id);

      if (fullUser && fullUser.following) {
        const followingIds = fullUser.following.map((f: Types.ObjectId | { _id: Types.ObjectId }) =>
          (f instanceof Types.ObjectId ? f : f._id).toString(),
        );
        isFollowing = followingIds.includes(p.authorId.toString());
      }
    }

    return {
      ...p,
      isLiked: user ? (p.likedBy || []).includes(user.id) : false,
      isFollowing,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  @ApiOperation({ summary: "Update a post" })
  async update(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() updatePostDto: UpdatePostDto) {
    const connection = req.tenantConnection;
    const tenant = req.tenant;
    return this.postsService.update(connection, id, updatePostDto, tenant);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @ApiOperation({ summary: "Soft delete a post" })
  async remove(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const connection = req.tenantConnection;
    return this.postsService.delete(connection, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/publish")
  @ApiOperation({ summary: "Publish a post" })
  async publish(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const connection = req.tenantConnection;
    return this.postsService.update(connection, id, {
      status: "published",
      publishedAt: new Date(),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/schedule")
  @ApiOperation({ summary: "Schedule a post for future publication" })
  async schedule(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: { scheduledAt: string }) {
    const connection = req.tenantConnection;
    const scheduledAt = new Date(body.scheduledAt);
    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException("Invalid date format");
    }
    return this.postsService.update(connection, id, {
      status: "scheduled",
      scheduledAt: body.scheduledAt,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/restore")
  @ApiOperation({ summary: "Restore a soft-deleted post" })
  async restore(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const connection = req.tenantConnection;
    const tenant = req.tenant;
    return this.postsService.restore(connection, id, tenant);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/unpublish")
  @ApiOperation({ summary: "Unpublish a post" })
  async unpublish(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const connection = req.tenantConnection;
    return this.postsService.update(connection, id, { status: "draft" });
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/like")
  @ApiOperation({ summary: "Like a post" })
  async like(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    await this.postsService.incrementLikes(connection, id, user.id);
    return { isLiked: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/unlike")
  @ApiOperation({ summary: "Unlike a post" })
  async unlike(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    await this.postsService.decrementLikes(connection, id, user.id);
    return { isLiked: false };
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/save")
  @ApiOperation({ summary: "Save a post to library" })
  async save() {
    return { isSaved: true };
  }
}
