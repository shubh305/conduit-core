import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { CatalystService } from "./catalyst.service";
import { CatalystController } from "./catalyst.controller";

@Module({
  imports: [HttpModule],
  controllers: [CatalystController],
  providers: [CatalystService],
})
export class CatalystModule {}
