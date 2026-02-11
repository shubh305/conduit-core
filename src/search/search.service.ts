import { Injectable } from "@nestjs/common";
import { Connection, Types } from "mongoose";
import { UsersService } from "../users/users.service";
import { FeedService } from "../feed/feed.service";
import { TagsService } from "../feed/tags.service";

@Injectable()
export class SearchService {
  constructor(
    private readonly usersService: UsersService,
    private readonly feedService: FeedService,
    private readonly tagsService: TagsService,
  ) {}

  async search(connection: Connection, query: string) {
    if (!query) return { results: { users: [], posts: [], tags: [] } };

    const [users, posts, tags] = await Promise.all([
      this.usersService.search(connection, query),
      this.feedService.search(query),
      this.tagsService.search(query),
    ]);

    return {
      results: {
        users,
        posts,
        tags,
      },
    };
  }

  async suggest(connection: Connection, query: string) {
    if (!query) return [];

    const [users, posts, tags] = await Promise.all([
      connection ? this.usersService.suggest(connection, query) : Promise.resolve([]),
      this.feedService.suggest(query),
      this.tagsService.search(query),
    ]);

    const suggestions: Array<{
      type: string;
      text: string;
      id: string | Types.ObjectId;
      url?: string;
    }> = [];

    tags.forEach(tag => suggestions.push({ type: "tag", text: `#${tag.slug}`, id: tag._id }));

    users.forEach(user => suggestions.push({ type: "user", text: user.username, id: user._id }));

    posts.forEach(post =>
      suggestions.push({
        type: "post",
        text: post.title,
        id: post.postId,
        url: `/${post.tenantSlug}/${post.postSlug}`,
      }),
    );

    return suggestions.slice(0, 10);
  }
}
