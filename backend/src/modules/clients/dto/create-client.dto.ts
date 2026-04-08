import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(1)
  phone!: string;
}
