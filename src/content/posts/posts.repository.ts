import { Injectable } from "@nestjs/common";
import { Connection, Model, Types, FilterQuery } from "mongoose";
import { Post, PostSchema, PostDocument } from "./schemas/post.schema";

/**
 * Repository for managing Post documents within a specific tenant's database.
 */
@Injectable()
export class PostsRepository {
  private getModel(connection: Connection): Model<PostDocument> {
    return connection.model(
      Post.name,
      PostSchema,
    ) as unknown as Model<PostDocument>;
  }

  async create(
    connection: Connection,
    postData: Partial<Post>,
  ): Promise<PostDocument> {
    const postModel = this.getModel(connection);
    const newPost = new postModel(postData);
    return newPost.save();
  }

  async findAll(
    connection: Connection,
    filter: FilterQuery<PostDocument> = {},
    options: {
      skip?: number;
      limit?: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sort?: any;
    } = {},
  ): Promise<PostDocument[]> {
    const postModel = this.getModel(connection);
    return postModel
      .find(filter)
      .sort(options.sort || { createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 10)
      .exec();
  }

  async findOne(
    connection: Connection,
    filter: FilterQuery<PostDocument>,
  ): Promise<PostDocument | null> {
    const postModel = this.getModel(connection);
    return postModel.findOne(filter).exec();
  }

  async findById(
    connection: Connection,
    id: string,
  ): Promise<PostDocument | null> {
    const postModel = this.getModel(connection);
    return postModel.findById(id).exec();
  }

  async update(
    connection: Connection,
    id: string,
    updateData: Partial<Post>,
  ): Promise<PostDocument | null> {
    const postModel = this.getModel(connection);
    return postModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(
    connection: Connection,
    id: string,
  ): Promise<PostDocument | null> {
    const postModel = this.getModel(connection);

    return postModel.findByIdAndDelete(id).exec();
  }

  async restore(
    connection: Connection,
    id: string,
  ): Promise<PostDocument | null> {
    const postModel = this.getModel(connection);
    return postModel
      .findByIdAndUpdate(id, { $unset: { deletedAt: 1 } }, { new: true })
      .exec();
  }

  async findBySlug(
    connection: Connection,
    slug: string,
  ): Promise<PostDocument | null> {
    const postModel = this.getModel(connection);
    return postModel.findOne({ slug }).exec();
  }

  async incrementLikes(
    connection: Connection,
    id: string,
    userId: string,
  ): Promise<void> {
    const postModel = this.getModel(connection);

    const objectId = new Types.ObjectId(id);

    await postModel
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
    const postModel = this.getModel(connection);
    const objectId = new Types.ObjectId(id);

    await postModel
      .updateOne(
        { _id: objectId, likedBy: userId },
        {
          $pull: { likedBy: userId },
          $inc: { likesCount: -1 },
        },
      )
      .exec();
  }

  async count(
    connection: Connection,
    filter: FilterQuery<PostDocument> = {},
  ): Promise<number> {
    const postModel = this.getModel(connection);
    return postModel.countDocuments(filter).exec();
  }

  async search(connection: Connection, query: string): Promise<PostDocument[]> {
    const postModel = this.getModel(connection);
    return postModel
      .find({
        status: "published",
        $or: [
          { title: { $regex: query, $options: "i" } },
          { excerpt: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      })
      .limit(10)
      .exec();
  }
}
