import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from "class-validator";

export class CompleteAppointmentDto {
  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @IsNumber()
  @Min(0)
  amount?: number | null;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @IsNumber()
  @Min(0)
  extra_amount?: number | null;

  @IsOptional()
  @IsBoolean()
  ignore_discount?: boolean;

  @IsOptional()
  @ValidateIf((_, v: unknown) => v !== undefined && v !== null)
  @IsNumber()
  @Min(0)
  service_amount?: number | null;
}
