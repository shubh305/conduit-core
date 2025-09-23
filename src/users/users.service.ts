import { Injectable } from "@nestjs/common";
import { Connection } from "mongoose";
import { UsersRepository } from "./users.repository";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(
    connection: Connection,
    userData: Partial<User>,
  ): Promise<UserDocument> {
    return this.usersRepository.create(connection, userData);
  }

  async findByEmail(
    connection: Connection,
    email: string,
  ): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(connection, email);
  }

  async findByUsername(
    connection: Connection,
    username: string,
  ): Promise<UserDocument | null> {
    return this.usersRepository.findByUsername(connection, username);
  }

  async findById(
    connection: Connection,
    id: string,
  ): Promise<UserDocument | null> {
    return this.usersRepository.findById(connection, id);
  }

  async update(
    connection: Connection,
    id: string,
    updateData: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.usersRepository.update(connection, id, updateData);
  }

  async search(connection: Connection, query: string): Promise<UserDocument[]> {
    return this.usersRepository.search(connection, query);
  }

  async suggest(
    connection: Connection,
    query: string,
  ): Promise<UserDocument[]> {
    return this.usersRepository.suggest(connection, query);
  }

  async findByIds(
    connection: Connection,
    ids: string[],
  ): Promise<UserDocument[]> {
    return Promise.all(
      ids.map((id) => this.usersRepository.findById(connection, id)),
    ).then((users) => users.filter((u) => u !== null) as UserDocument[]);
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async followUser(
    connection: Connection,
    currentUserId: string,
    targetUserId: string,
  ) {
    return { success: true, isFollowing: true };
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
