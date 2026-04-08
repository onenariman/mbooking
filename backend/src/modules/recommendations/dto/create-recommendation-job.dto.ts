import { IsIn, IsOptional, IsUUID, Matches, ValidateIf } from "class-validator";
import { PRESET_PERIODS, type PresetPeriod } from "../recommendations-range.util";

export type RecommendationPresetPeriod = PresetPeriod;

export class CreateRecommendationJobDto {
  @IsOptional()
  @IsIn([...PRESET_PERIODS])
  period?: RecommendationPresetPeriod;

  @ValidateIf((o: CreateRecommendationJobDto) => !o.period)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ValidateIf((o: CreateRecommendationJobDto) => !o.period)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsUUID()
  prompt_id?: string | null;
}
