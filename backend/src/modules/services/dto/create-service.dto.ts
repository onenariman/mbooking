import { IsNumber, IsString, IsUUID, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

export class CreateServiceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ValidateIf((_, value: unknown) => value !== null)
  @IsUUID()
  category_id!: string | null;

  @ValidateIf((_, value: unknown) => value !== null)
  @IsNumber()
  @Min(0)
  price!: number | null;
}
