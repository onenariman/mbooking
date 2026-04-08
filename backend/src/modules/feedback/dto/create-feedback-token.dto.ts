import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateFeedbackTokenDto {
  /** Интервал как в Supabase RPC, напр. `14 days` */
  @IsOptional()
  @IsString()
  @MinLength(1)
  expiresIn?: string;
}
