import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PushModule } from "../push/push.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";

@Module({
  imports: [AuthModule, PushModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
