import { Injectable } from "@nestjs/common";
import { Connection, Types } from "mongoose";
import { Post, PostSchema } from "../posts/schemas/post.schema";
import { FeedService } from "../../feed/feed.service";
import { CommentsRepository } from "./comments.repository";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CommentDocument } from "./schemas/comment.schema";

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly feedService: FeedService,
  ) {}

  async create(
    connection: Connection,
    postId: string,
    authorId: string,
    authorName: string,
    authorAvatar: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    const comment = await this.commentsRepository.create(connection, {
      postId,
      authorId,
      authorName,
      authorAvatar,
      text: dto.text,
      parentId: dto.parentId,
    });

    await connection
      .model(Post.name, PostSchema)
      .updateOne({ _id: new Types.ObjectId(postId) }, { $inc: { commentsCount: 1 } })
      .exec();

    this.feedService
      .updateCommentsCount(postId, true)
      .catch(err => console.error("Failed to sync comment count to feed", err));

    return comment;
  }

  async findByPostId(connection: Connection, postId: string): Promise<CommentDocument[]> {
    return this.commentsRepository.findByPostId(connection, postId);
  }

  async incrementLikes(connection: Connection, id: string, userId: string): Promise<void> {
    return this.commentsRepository.incrementLikes(connection, id, userId);
  }

  async decrementLikes(connection: Connection, id: string, userId: string): Promise<void> {
    return this.commentsRepository.decrementLikes(connection, id, userId);
  }
}
