import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Email no válido" })
  email: string;

  @IsString({ message: "Escribe tu contraseña" })
  @MinLength(1, { message: "Escribe tu contraseña" })
  password: string;
}
