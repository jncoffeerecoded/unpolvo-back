import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { BODY_TYPES, GENDERS } from "../../constants";

export class CreateProfileDto {
  @IsString()
  @MinLength(5)
  @MaxLength(80)
  title: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  nickname: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  bio: string;

  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(99)
  age: number;

  @IsIn(GENDERS as unknown as string[])
  gender: string;

  @IsString()
  countryCode: string;

  @IsString()
  citySlug: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsIn(BODY_TYPES as unknown as string[])
  bodyType?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  featured?: boolean;
}
