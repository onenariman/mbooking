import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class ActivateClientInvitationDto {
  /** Для активации кабинета обязателен; для password_reset не нужен (email берётся из аккаунта) */
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  confirm_password!: string;
}
