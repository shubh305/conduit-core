import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { AuthenticatedRequest } from "../../common/interfaces/authenticated-request.interface";

@ApiTags("comments")
@Controller("comments")
export class CommentsActionsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Like a comment" })
  async like(@Req() req: AuthenticatedRequest, @Param("id") commentId: string) {
    const connection = req.tenantConnection;
    const user = req.user;
    await this.commentsService.incrementLikes(connection, commentId, user.id);
    return { isLiked: true };
  }

  @Post(":id/unlike")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unlike a comment" })
  async unlike(
    @Req() req: AuthenticatedRequest,
    @Param("id") commentId: string,
  ) {
    const connection = req.tenantConnection;
    const user = req.user;
    await this.commentsService.decrementLikes(connection, commentId, user.id);
    return { isLiked: false };
  }
}

@ApiTags("comments")
@Controller("posts/:id/comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get comments for a post" })
  async getComments(
    @Req() req: AuthenticatedRequest,
    @Param("id") postId: string,
  ) {
    const connection = req.tenantConnection;
    const user = req.user;
    const comments = await this.commentsService.findByPostId(
      connection,
      postId,
    );

    const commentMap = new Map();
    const roots = [];

    const rawComments = comments.map((c) => {
      const json = c.toObject ? c.toObject() : c;
      return {
        ...json,
        id: json._id,
        children: [],
        likes: json.likesCount || 0,
        isLiked: user ? (json.likedBy || []).includes(user.id) : false,
      };
    });

    rawComments.forEach((c) => commentMap.set(c.id.toString(), c));

    rawComments.forEach((c) => {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId).children.push(c);
      } else {
        roots.push(c);
      }
    });

    return { comments: roots, meta: { total: comments.length } };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a comment to a post" })
  async createComment(
    @Req() req: AuthenticatedRequest,
    @Param("id") postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    const connection = req.tenantConnection;
    const user = req.user;

    const comment = await this.commentsService.create(
      connection,
      postId,
      user.id,
      user.displayName,
      user.avatar || "",
      dto,
    );

    return { comment };
  }
}
