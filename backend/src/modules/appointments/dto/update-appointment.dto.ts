import { AppointmentStatus } from "@prisma/client";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from "class-validator";

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  client_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  client_phone?: string;

  @IsOptional()
  @IsUUID()
  service_id?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  service_name?: string;

  @IsOptional()
  @IsString()
  category_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  appointment_at?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  appointment_end?: string | null;

  @IsOptional()
  @IsUUID()
  applied_discount_id?: string | null;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsNumber()
  amount?: number | null;

  @IsOptional()
  notes?: string | null;
}
