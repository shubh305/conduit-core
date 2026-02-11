import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListsService } from "./lists.service";
import { CreateListDto, UpdateListDto } from "./dto/lists.dto";

@ApiTags("lists")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("lists")
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new reading list" })
  create(@Req() req, @Body() createListDto: CreateListDto) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.create(userId, createListDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all user reading lists" })
  findAll(@Req() req) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.findAll(userId);
  }

  @Get("check/:postId")
  @ApiOperation({ summary: "Check which lists a post is in" })
  checkPost(@Req() req, @Param("postId") postId: string) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.checkPostInLists(userId, postId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific reading list" })
  findOne(@Req() req, @Param("id") id: string) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.findOne(id, userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a reading list" })
  update(@Req() req, @Param("id") id: string, @Body() updateListDto: UpdateListDto) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.update(id, userId, updateListDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a reading list" })
  delete(@Req() req, @Param("id") id: string) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.delete(id, userId);
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Add a post to a reading list" })
  addItem(@Req() req, @Param("id") id: string, @Body("postId") postId: string) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.addItem(id, userId, postId);
  }

  @Delete(":id/items/:postId")
  @ApiOperation({ summary: "Remove a post from a reading list" })
  removeItem(@Req() req, @Param("id") id: string, @Param("postId") postId: string) {
    const userId = req.user["id"] || req.user["sub"];
    return this.listsService.removeItem(id, userId, postId);
  }
}
