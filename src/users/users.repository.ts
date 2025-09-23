import { Injectable } from "@nestjs/common";
import { Connection, Model } from "mongoose";
import { User, UserSchema, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersRepository {
  private getModel(connection: Connection): Model<UserDocument> {
    return connection.model(
      User.name,
      UserSchema,
    ) as unknown as Model<UserDocument>;
  }

  async create(
    connection: Connection,
    createUserDto: Partial<User>,
  ): Promise<UserDocument> {
    const userModel = this.getModel(connection);
    return new userModel(createUserDto).save() as Promise<UserDocument>;
  }

  async findByEmail(
    connection: Connection,
    email: string,
  ): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel.findOne({ email }).exec();
  }

  async findByUsername(
    connection: Connection,
    username: string,
  ): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    console.log(
      `[UsersRepository] Finding user by username: ${username}`,
      userModel.db.name,
    );
    return userModel.findOne({ username }).exec();
  }

  async findById(
    connection: Connection,
    id: string,
  ): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel.findById(id).exec();
  }

  async update(
    connection: Connection,
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    const userModel = this.getModel(connection);
    return userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
  }

  async search(connection: Connection, query: string): Promise<UserDocument[]> {
    const userModel = this.getModel(connection);
    return userModel
      .find({
        $or: [{ username: { $regex: query, $options: "i" } }],
      })
      .limit(10)
      .exec();
  }

  async suggest(
    connection: Connection,
    query: string,
  ): Promise<UserDocument[]> {
    const userModel = this.getModel(connection);
    return userModel
      .find({
        $or: [
          { username: { $regex: query, $options: "i" } },
          { displayName: { $regex: query, $options: "i" } },
        ],
      })
      .select("username displayName avatar")
      .limit(5)
      .exec();
  }
}
