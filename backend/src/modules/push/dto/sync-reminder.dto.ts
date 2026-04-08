import { IsUUID } from "class-validator";

export class SyncReminderDto {
  @IsUUID("4")
  appointment_id!: string;
}
