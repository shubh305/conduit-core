import { Injectable } from "@nestjs/common";
import { Connection } from "mongoose";
import { UsersRepository } from "./users.repository";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(connection: Connection, userData: Partial<User>): Promise<UserDocument> {
    return this.usersRepository.create(connection, userData);
  }

  async findByEmail(connection: Connection, email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(connection, email);
  }

  async findByUsername(connection: Connection, username: string): Promise<UserDocument | null> {
    return this.usersRepository.findByUsername(connection, username);
  }

  async findById(connection: Connection, id: string): Promise<UserDocument | null> {
    return this.usersRepository.findById(connection, id);
  }

  async findByIdWithFollowing(connection: Connection, id: string): Promise<UserDocument | null> {
    return this.usersRepository.findByIdWithFollowing(connection, id);
  }

  async update(connection: Connection, id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.usersRepository.update(connection, id, updateData);
  }

  async search(connection: Connection, query: string, excludeIds: string[] = []): Promise<UserDocument[]> {
    return this.usersRepository.search(connection, query, excludeIds);
  }

  async suggest(connection: Connection, query: string): Promise<UserDocument[]> {
    return this.usersRepository.suggest(connection, query);
  }

  async findByIds(connection: Connection, ids: string[]): Promise<UserDocument[]> {
    return Promise.all(ids.map(id => this.usersRepository.findById(connection, id))).then(
      users => users.filter(u => u !== null) as UserDocument[],
    );
  }

  async followUser(connection: Connection, currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new Error("Cannot follow yourself");
    }
    await this.usersRepository.follow(connection, currentUserId, targetUserId);
    const targetUser = await this.usersRepository.findById(connection, targetUserId);
    return {
      success: true,
      isFollowing: true,
      followersCount: targetUser?.followers?.length || 0,
    };
  }

  async unfollowUser(connection: Connection, currentUserId: string, targetUserId: string) {
    await this.usersRepository.unfollow(connection, currentUserId, targetUserId);
    const targetUser = await this.usersRepository.findById(connection, targetUserId);
    return {
      success: true,
      isFollowing: false,
      followersCount: targetUser?.followers?.length || 0,
    };
  }
}
