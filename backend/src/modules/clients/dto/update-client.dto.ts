import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;
}
