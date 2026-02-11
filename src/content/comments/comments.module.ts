import { Module } from "@nestjs/common";

import { CommentsController, CommentsActionsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { CommentsRepository } from "./comments.repository";

@Module({
  imports: [],
  controllers: [CommentsController, CommentsActionsController],
  providers: [CommentsService, CommentsRepository],
  exports: [CommentsService],
})
export class CommentsModule {}
