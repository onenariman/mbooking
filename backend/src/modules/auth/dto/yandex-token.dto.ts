import { IsString, MinLength } from "class-validator";

export class YandexTokenDto {
  @IsString()
  @MinLength(4)
  code!: string;
}
