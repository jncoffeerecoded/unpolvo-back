import { IsString, MaxLength, MinLength } from "class-validator";

export class SendMessageDto {
  @IsString({ message: "El mensaje es obligatorio" })
  @MinLength(1, { message: "Escribe un mensaje" })
  @MaxLength(2000, { message: "Máximo 2000 caracteres" })
  body: string;
}
