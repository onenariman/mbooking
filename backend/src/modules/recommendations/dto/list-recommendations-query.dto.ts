import { IsIn, IsOptional, Matches, ValidateIf } from "class-validator";
import { PRESET_PERIODS, type PresetPeriod } from "../recommendations-range.util";

export class ListRecommendationsQueryDto {
  @IsOptional()
  @IsIn([...PRESET_PERIODS])
  period?: PresetPeriod;

  @ValidateIf((o: ListRecommendationsQueryDto) => !o.period)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ValidateIf((o: ListRecommendationsQueryDto) => !o.period)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}
