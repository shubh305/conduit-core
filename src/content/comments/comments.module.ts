import { Module } from "@nestjs/common";
import { FeedModule } from "../../feed/feed.module";
import {
  CommentsController,
  CommentsActionsController,
} from "./comments.controller";
import { CommentsService } from "./comments.service";
import { CommentsRepository } from "./comments.repository";

@Module({
  imports: [FeedModule],
  controllers: [CommentsController, CommentsActionsController],
  providers: [CommentsService, CommentsRepository],
  exports: [CommentsService],
})
export class CommentsModule {}
