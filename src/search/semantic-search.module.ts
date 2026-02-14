import { Module, Global } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SemanticSearchService } from "./semantic-search.service";

@Global()
@Module({
  imports: [HttpModule],
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
