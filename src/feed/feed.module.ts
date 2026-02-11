import { Module, Global } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FeedService } from "./feed.service";
import { FeedRepository } from "./feed.repository";
import { FeedItem, FeedItemSchema } from "./schemas/feed-item.schema";
import { FeedController } from "./feed.controller";
import { TagsService } from "./tags.service";
import { GlobalTag, GlobalTagSchema } from "./schemas/global-tag.schema";
import { UsersModule } from "../users/users.module";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeedItem.name, schema: FeedItemSchema },
      { name: GlobalTag.name, schema: GlobalTagSchema },
    ]),
    UsersModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedRepository, TagsService],
  exports: [FeedService, TagsService, FeedRepository],
})
export class FeedModule {}
