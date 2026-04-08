import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export class SubmitFeedbackDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  feedback_text!: string;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score_result?: number | null;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score_explanation?: number | null;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score_comfort?: number | null;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score_booking?: number | null;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score_recommendation?: number | null;
}
