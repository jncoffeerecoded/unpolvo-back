import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { BODY_TYPES, GENDERS } from "../../constants";

const emptyToUndef = ({ value }: { value: unknown }) =>
  value === "" || value == null ? undefined : value;

export class CreateProfileDto {
  @IsString({ message: "El título es obligatorio" })
  @MinLength(5, { message: "Mínimo 5 caracteres" })
  @MaxLength(80, { message: "Máximo 80 caracteres" })
  title: string;

  @IsString({ message: "El apodo es obligatorio" })
  @MinLength(2, { message: "Mínimo 2 caracteres" })
  @MaxLength(40, { message: "Máximo 40 caracteres" })
  nickname: string;

  @IsString({ message: "La descripción es obligatoria" })
  @MinLength(20, {
    message: "Cuéntanos un poco más sobre ti (mín. 20 caracteres)",
  })
  @MaxLength(2000, { message: "Máximo 2000 caracteres" })
  bio: string;

  @Type(() => Number)
  @IsInt({ message: "Edad no válida" })
  @Min(18, { message: "Debes ser mayor de 18 años" })
  @Max(99, { message: "Edad no válida" })
  age: number;

  @IsIn(GENDERS as unknown as string[], { message: "Selecciona una opción" })
  gender: string;

  @IsString({ message: "Selecciona un país" })
  countryCode: string;

  @IsString({ message: "Selecciona una ciudad" })
  citySlug: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsIn(BODY_TYPES as unknown as string[], { message: "Complexión no válida" })
  bodyType?: string;

  // ─── Métodos de contacto (todos opcionales) ─────────────────────
  @IsOptional()
  @Transform(emptyToUndef)
  @IsEmail({}, { message: "Correo electrónico no válido" })
  @MaxLength(120)
  contactEmail?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @Matches(/^\+?[0-9\s().-]{6,20}$/, {
    message: "Teléfono no válido (incluye el código de país, ej. +34 600 111 222)",
  })
  contactPhone?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @Matches(/^\+?[0-9\s().-]{6,20}$/, {
    message: "WhatsApp no válido (incluye el código de país, ej. +52 55 1234 5678)",
  })
  contactWhatsapp?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  featured?: boolean;
}
