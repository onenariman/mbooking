import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class AppointmentEventPushDto {
  @IsUUID("4")
  appointment_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  appointment_label?: string | null;

  @IsIn(["created", "rescheduled", "cancelled"])
  event!: "created" | "rescheduled" | "cancelled";
}
