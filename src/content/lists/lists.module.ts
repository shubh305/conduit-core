import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ListsController } from "./lists.controller";
import { ListsService } from "./lists.service";
import { ReadingList, ReadingListSchema } from "./schemas/reading-list.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReadingList.name, schema: ReadingListSchema },
    ]),
  ],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService],
})
export class ListsModule {}
