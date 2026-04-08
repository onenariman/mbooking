import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsUUID()
  category_id?: string | null;

  @IsOptional()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsNumber()
  @Min(0)
  price?: number | null;
}
