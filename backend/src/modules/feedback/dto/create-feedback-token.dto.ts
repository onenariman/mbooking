import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateFeedbackTokenDto {
  /** Интервал для срока токена, напр. `14 days` */
  @IsOptional()
  @IsString()
  @MinLength(1)
  expiresIn?: string;
}
