import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

const emptyToUndef = ({ value }: { value: unknown }) =>
  value === "" || value == null ? undefined : value;

export class CreatePlanDto {
  @IsString({ message: "El nombre es obligatorio" })
  @MinLength(2, { message: "Mínimo 2 caracteres" })
  @MaxLength(60, { message: "Máximo 60 caracteres" })
  name: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(500, { message: "Máximo 500 caracteres" })
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Precio no válido" })
  @Min(0, { message: "El precio no puede ser negativo" })
  price: number;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @Length(3, 3, { message: "Moneda no válida (3 letras, ej. USD)" })
  currency?: string;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Mínimo 2 caracteres" })
  @MaxLength(60, { message: "Máximo 60 caracteres" })
  name?: string;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @MaxLength(500, { message: "Máximo 500 caracteres" })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "Precio no válido" })
  @Min(0, { message: "El precio no puede ser negativo" })
  price?: number;

  @IsOptional()
  @Transform(emptyToUndef)
  @IsString()
  @Length(3, 3, { message: "Moneda no válida (3 letras, ej. USD)" })
  currency?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  active?: boolean;
}
