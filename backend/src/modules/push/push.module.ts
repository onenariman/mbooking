import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AppointmentReminderDispatchService } from "./appointment-reminder-dispatch.service";
import { AppointmentRemindersSyncService } from "./appointment-reminders-sync.service";
import { RemindersDispatchAuthGuard } from "./guards/reminders-dispatch-auth.guard";
import { RemindersDispatchCron } from "./reminders-dispatch.cron";
import { PushController } from "./push.controller";
import { PushSendService } from "./push-send.service";

@Module({
  imports: [AuthModule],
  controllers: [PushController],
  providers: [
    AppointmentRemindersSyncService,
    PushSendService,
    AppointmentReminderDispatchService,
    RemindersDispatchCron,
    JwtAuthGuard,
    RemindersDispatchAuthGuard,
  ],
  exports: [
    AppointmentRemindersSyncService,
    AppointmentReminderDispatchService,
    PushSendService,
  ],
})
export class PushModule {}
