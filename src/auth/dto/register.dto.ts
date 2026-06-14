import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsString({ message: "Escribe tu nombre" })
  @MinLength(2, { message: "Escribe tu nombre" })
  @MaxLength(80, { message: "Nombre demasiado largo" })
  name: string;

  @IsEmail({}, { message: "Email no válido" })
  email: string;

  @IsString({ message: "La contraseña es obligatoria" })
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  password: string;
}
