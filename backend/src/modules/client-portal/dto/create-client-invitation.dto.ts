import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateClientInvitationDto {
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsOptional()
  @IsUUID()
  client_user_id?: string;

  @IsString()
  @MinLength(1)
  client_phone!: string;

  @IsOptional()
  @IsEnum(["activation", "password_reset"])
  purpose?: "activation" | "password_reset";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 14)
  expires_in_hours?: number;
}
