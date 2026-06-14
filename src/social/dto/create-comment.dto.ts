import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
  @IsString({ message: "Escribe un comentario" })
  @MinLength(2, { message: "Escribe un comentario" })
  @MaxLength(1000, { message: "Comentario demasiado largo (máx. 1000)" })
  body: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
