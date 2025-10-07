import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCommentDto {
  @ApiProperty({ example: "This is a great post!" })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ required: false, example: "parent_comment_id" })
  @IsOptional()
  @IsString()
  parentId?: string;
}
