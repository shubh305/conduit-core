import { Injectable } from "@nestjs/common";
import { Connection, Model, Types } from "mongoose";
import {
  Comment,
  CommentSchema,
  CommentDocument,
} from "./schemas/comment.schema";

@Injectable()
export class CommentsRepository {
  private getModel(connection: Connection): Model<CommentDocument> {
    return connection.model(
      Comment.name,
      CommentSchema,
    ) as unknown as Model<CommentDocument>;
  }

  async create(
    connection: Connection,
    data: Partial<Comment>,
  ): Promise<CommentDocument> {
    const model = this.getModel(connection);
    return new model(data).save();
  }

  async findByPostId(
    connection: Connection,
    postId: string,
  ): Promise<CommentDocument[]> {
    const model = this.getModel(connection);
    return model.find({ postId }).sort({ createdAt: 1 }).exec();
  }

  async findById(
    connection: Connection,
    id: string,
  ): Promise<CommentDocument | null> {
    const model = this.getModel(connection);
    return model.findById(id).exec();
  }

  async incrementLikes(
    connection: Connection,
    id: string,
    userId: string,
  ): Promise<void> {
    const model = this.getModel(connection);
    const objectId = new Types.ObjectId(id);

    await model
      .updateOne(
        { _id: objectId, likedBy: { $ne: userId } },
        {
          $addToSet: { likedBy: userId },
          $inc: { likesCount: 1 },
        },
      )
      .exec();
  }

  async decrementLikes(
    connection: Connection,
    id: string,
    userId: string,
  ): Promise<void> {
    const model = this.getModel(connection);
    const objectId = new Types.ObjectId(id);

    await model
      .updateOne(
        { _id: objectId, likedBy: userId },
        {
          $pull: { likedBy: userId },
          $inc: { likesCount: -1 },
        },
      )
      .exec();
  }
}
