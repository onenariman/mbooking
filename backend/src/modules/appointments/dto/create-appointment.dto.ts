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

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  client_name!: string;

  @IsString()
  @MinLength(1)
  client_phone!: string;

  @IsUUID()
  service_id!: string;

  @IsString()
  @MinLength(1)
  service_name!: string;

  @IsOptional()
  @IsString()
  category_name?: string;

  @IsString()
  @MinLength(1)
  appointment_at!: string;

  @IsString()
  @MinLength(1)
  appointment_end!: string;

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
