import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { UsersModule } from "../users/users.module";
import { ContentModule } from "../content/content.module";
import { FeedModule } from "../feed/feed.module";
import { SemanticSearchModule } from "./semantic-search.module";
import { IngestionResultConsumerService } from "./ingestion-result-consumer.service";

@Module({
  imports: [UsersModule, ContentModule, FeedModule, SemanticSearchModule],
  controllers: [SearchController],
  providers: [SearchService, IngestionResultConsumerService],
})
export class SearchModule {}
