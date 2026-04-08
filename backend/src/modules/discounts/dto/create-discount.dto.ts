import { Type } from "class-transformer";
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateDiscountDto {
  @IsString()
  @MinLength(1)
  client_phone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  discount_percent!: number;

  @IsUUID()
  service_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;

  @IsOptional()
  @IsISO8601()
  expires_at?: string | null;
}
