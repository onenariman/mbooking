import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AppointmentReminderDispatchService } from "./appointment-reminder-dispatch.service";

@Injectable()
export class RemindersDispatchCron {
  private readonly logger = new Logger(RemindersDispatchCron.name);

  constructor(
    private readonly dispatch: AppointmentReminderDispatchService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async runDispatch(): Promise<void> {
    if (!this.config.get<boolean>("app.remindersCronEnabled", true)) {
      return;
    }
    try {
      await this.dispatch.dispatchDue({});
    } catch (error) {
      this.logger.warn(
        `Reminders dispatch cron: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }
}
