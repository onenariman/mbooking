import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

function emptyToNull(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function digitsOnly(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return value.replace(/\D/g, "");
}

export class PatchOwnerOrganizationDto {
  @IsOptional()
  @Transform(({ value }) => emptyToNull(value))
  @IsString()
  @MaxLength(120)
  full_name?: string | null;

  /**
   * Храним в нормализованном виде `7XXXXXXXXXX`.
   * Принимаем только цифры, пустое -> null.
   */
  @IsOptional()
  @Transform(({ value }) => emptyToNull(digitsOnly(value)))
  @IsString()
  @Matches(/^7\d{10}$/, { message: "Телефон должен быть в формате 7XXXXXXXXXX" })
  phone?: string | null;

  @IsOptional()
  @Transform(({ value }) => emptyToNull(digitsOnly(value)))
  @IsString()
  @Matches(/^(\d{10}|\d{12})$/, { message: "ИНН должен содержать 10 или 12 цифр" })
  inn?: string | null;
}

