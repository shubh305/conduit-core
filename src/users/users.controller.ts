import {
  Controller,
  Get,
  Req,
  Param,
  Query,
  BadRequestException,
  Patch,
  Body,
  UseGuards,
  Post,
  Delete,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { PostsService } from "../content/posts/posts.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async getMe(@Req() req: AuthenticatedRequest) {
    const connection = req.tenantConnection;
    const user = req.user;

    const fullUser = await this.usersService.findById(connection, user.id);
    if (!fullUser) throw new BadRequestException("User not found");

    const publicData = fullUser.toObject ? fullUser.toObject() : fullUser;
    delete (publicData as { passwordHash?: string }).passwordHash;
    return { user: publicData };
  }

  @Get("me/following")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get users followed by current user" })
  async getFollowing(@Req() req: AuthenticatedRequest) {
    const connection = req.tenantConnection;
    const user = req.user;

    const fullUser = await this.usersService.findByIdWithFollowing(connection, user.id);
    if (!fullUser) throw new BadRequestException("User not found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const following = (fullUser.following || []) as any[];

    const publicUsers = following
      .filter(u => u && typeof u === "object" && u.username)
      .map(u => {
        const publicData = u.toObject ? u.toObject() : u;
        delete (publicData as { passwordHash?: string }).passwordHash;
        return publicData;
      });

    return { users: publicUsers };
  }

  @Get(":username")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get public user profile" })
  async getProfile(@Req() req: AuthenticatedRequest, @Param("username") username: string) {
    const connection = req.tenantConnection;
    const user = await this.usersService.findByUsername(connection, username);
    if (!user) throw new BadRequestException("User not found");

    const currentUser = req.user;
    let isFollowing = false;

    if (currentUser) {
      const freshCurrentUser = await this.usersService.findById(connection, currentUser.id);
      if (freshCurrentUser && freshCurrentUser.following) {
        isFollowing = freshCurrentUser.following.some(id => id.toString() === user._id.toString());
      }
    }

    const publicData = user.toObject ? user.toObject() : user;
    delete (publicData as { passwordHash?: string }).passwordHash;

    const followersCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;
    const postsCount = await this.postsService.countByAuthor(connection, user.id, "published");

    return {
      user: {
        ...publicData,
        isFollowing,
        stats: {
          followers: followersCount,
          following: followingCount,
          posts: postsCount,
        },
      },
    };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Search users" })
  async findAll(@Req() req: AuthenticatedRequest, @Query("search") search: string) {
    const connection = req.tenantConnection;
    let excludeIds: string[] = [];
    if (req.user) {
      excludeIds.push(req.user.id);
      const fullUser = await this.usersService.findById(connection, req.user.id);
      if (fullUser && fullUser.following && fullUser.following.length > 0) {
        excludeIds = [...excludeIds, ...fullUser.following.map(id => id.toString())];
      }
    }

    const users = await this.usersService.search(connection, search || "", excludeIds);

    const publicUsers = users.map(user => {
      const publicData = user.toObject ? user.toObject() : user;
      delete (publicData as { passwordHash?: string }).passwordHash;
      return {
        ...publicData,
        stats: {
          followers: user.followers ? user.followers.length : 0,
          following: user.following ? user.following.length : 0,
        },
      };
    });

    return { users: publicUsers };
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() updateData: UpdateUserDto) {
    const connection = req.tenantConnection;
    const user = req.user;

    const { ...data } = updateData;
    const updateObj = data as Record<string, unknown>;
    delete updateObj.password;
    delete updateObj.role;
    delete updateObj.email;

    const updated = await this.usersService.update(connection, user.id, updateObj);
    return { user: updated };
  }

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Follow a user" })
  async followUser(@Req() req: AuthenticatedRequest, @Param("id") targetUserId: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    return this.usersService.followUser(connection, user.id, targetUserId);
  }

  @Post(":id/unfollow")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unfollow a user" })
  async unfollowUser(@Req() req: AuthenticatedRequest, @Param("id") targetUserId: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    return this.usersService.unfollowUser(connection, user.id, targetUserId);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unfollow a user (Delete method)" })
  async unfollowUserDelete(@Req() req: AuthenticatedRequest, @Param("id") targetUserId: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    return this.usersService.unfollowUser(connection, user.id, targetUserId);
  }
}
