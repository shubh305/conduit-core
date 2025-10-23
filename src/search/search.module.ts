import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { UsersModule } from "../users/users.module";
import { ContentModule } from "../content/content.module";
import { FeedModule } from "../feed/feed.module";

@Module({
  imports: [UsersModule, ContentModule, FeedModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
