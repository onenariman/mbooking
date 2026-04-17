import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class ClientSettingsDto {
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @Type(() => Number)
  @IsInt({ each: true })
  client_reminder_offsets_minutes?: number[];

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  quiet_hours_start_utc?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  quiet_hours_end_utc?: string | null;
}
