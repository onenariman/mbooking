import { IsBoolean, IsOptional } from "class-validator";

export class ClientSettingsDto {
  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;
}
