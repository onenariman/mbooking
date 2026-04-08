import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class ActivateClientInvitationDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  confirm_password!: string;
}
