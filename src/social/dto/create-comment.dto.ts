import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  body: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
