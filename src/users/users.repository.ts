import { Injectable } from "@nestjs/common";
import { Connection, Model, FilterQuery } from "mongoose";
import { User, UserSchema, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersRepository {
  private getModel(connection: Connection): Model<UserDocument> {
    if (!connection.models[User.name]) {
      connection.model(User.name, UserSchema);
    }
    return connection.model(User.name) as Model<UserDocument>;
  }

  async create(connection: Connection, createUserDto: Partial<User>): Promise<UserDocument> {
    const userModel = this.getModel(connection);
    return new userModel(createUserDto).save() as Promise<UserDocument>;
  }

  async findByEmail(connection: Connection, email: string): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel.findOne({ email }).exec();
  }

  async findByUsername(connection: Connection, username: string): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    console.log(`[UsersRepository] Finding user by username: ${username}`, userModel.db.name);
    return userModel.findOne({ username }).exec();
  }

  async findById(connection: Connection, id: string): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel.findById(id).exec();
  }

  async findByIdWithFollowing(connection: Connection, id: string): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel
      .findById(id)
      .populate({
        path: "following",
        model: userModel,
        select: "username displayName avatar",
      })
      .exec();
  }

  async update(connection: Connection, id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
  }

  async search(connection: Connection, query: string, excludeIds: string[] = []): Promise<UserDocument[]> {
    const userModel = this.getModel(connection);
    const filter: FilterQuery<UserDocument> = {
      $or: [{ username: { $regex: query, $options: "i" } }],
    };

    if (excludeIds.length > 0) {
      filter._id = { $nin: excludeIds };
    }

    return userModel.find(filter).limit(10).exec();
  }

  async suggest(connection: Connection, query: string): Promise<UserDocument[]> {
    const userModel = this.getModel(connection);
    return userModel
      .find({
        $or: [{ username: { $regex: query, $options: "i" } }, { displayName: { $regex: query, $options: "i" } }],
      })
      .select("username displayName avatar")
      .limit(5)
      .exec();
  }

  async follow(connection: Connection, currentUserId: string, targetUserId: string): Promise<void> {
    const userModel = this.getModel(connection);
    await Promise.all([
      userModel.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
      }),
      userModel.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
      }),
    ]);
  }

  async unfollow(connection: Connection, currentUserId: string, targetUserId: string): Promise<void> {
    const userModel = this.getModel(connection);
    await Promise.all([
      userModel.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      }),
      userModel.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      }),
    ]);
  }
}
