import { ArrayMaxSize, IsArray, IsInt } from "class-validator";
import { MAX_REMINDER_OFFSETS } from "../appointment-reminders-sync.service";

export class PatchPushSettingsDto {
  @IsArray()
  @ArrayMaxSize(MAX_REMINDER_OFFSETS)
  @IsInt({ each: true })
  reminder_offsets_minutes!: number[];
}
