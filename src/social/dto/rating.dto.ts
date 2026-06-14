import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class RatingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;
}
