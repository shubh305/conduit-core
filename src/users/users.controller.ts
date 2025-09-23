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
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  @Get(":username")
  @ApiOperation({ summary: "Get public user profile" })
  async getProfile(
    @Req() req: AuthenticatedRequest,
    @Param("username") username: string,
  ) {
    const connection = req.tenantConnection;
    const user = await this.usersService.findByUsername(connection, username);
    if (!user) throw new BadRequestException("User not found");

    const publicData = user.toObject ? user.toObject() : user;
    delete (publicData as { passwordHash?: string }).passwordHash;
    return { user: publicData };
  }

  @Get()
  @ApiOperation({ summary: "Search users" })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query("search") search: string,
  ) {
    const connection = req.tenantConnection;
    const users = await this.usersService.search(connection, search || "");

    const publicUsers = users.map((user) => {
      const publicData = user.toObject ? user.toObject() : user;
      delete (publicData as { passwordHash?: string }).passwordHash;
      return publicData;
    });

    return { users: publicUsers };
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateUserDto,
  ) {
    const connection = req.tenantConnection;
    const user = req.user;

    const { ...data } = updateData;
    const updateObj = data as Record<string, unknown>;
    delete updateObj.password;
    delete updateObj.role;
    delete updateObj.email;

    const updated = await this.usersService.update(
      connection,
      user.id,
      updateObj,
    );
    return { user: updated };
  }

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Follow a user" })
  async followUser(
    @Req() req: AuthenticatedRequest,
    @Param("id") targetUserId: string,
  ) {
    const connection = req.tenantConnection;
    const user = req.user;
    return this.usersService.followUser(connection, user.id, targetUserId);
  }
}
