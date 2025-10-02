import { Module } from "@nestjs/common";
import { PostsRepository } from "./posts/posts.repository";
import { PostsService } from "./posts/posts.service";
import { PostsController } from "./posts/posts.controller";
import { CommentsModule } from "./comments/comments.module";
import { ListsModule } from "./lists/lists.module";

@Module({
  imports: [CommentsModule, ListsModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsService, CommentsModule, ListsModule],
})
export class ContentModule {}
