import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateRecommendationPromptDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
