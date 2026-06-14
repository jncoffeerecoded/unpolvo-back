import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class RatingDto {
  @Type(() => Number)
  @IsInt({ message: "Valoración no válida" })
  @Min(1, { message: "Valoración no válida" })
  @Max(5, { message: "Valoración no válida" })
  value: number;
}
