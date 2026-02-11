import { forwardRef, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersRepository } from "./users.repository";
import { UsersController } from "./users.controller";
import { ContentModule } from "../content/content.module";

@Module({
  imports: [forwardRef(() => ContentModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
