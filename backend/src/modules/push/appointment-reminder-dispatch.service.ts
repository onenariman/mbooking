import { Injectable } from "@nestjs/common";
import { AppointmentStatus, ReminderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PushSendService } from "./push-send.service";

function formatOffsetLabel(offsetMinutes: number): string {
  if (offsetMinutes < 60) {
    return `${offsetMinutes} мин`;
  }
  const hours = offsetMinutes / 60;
  if (hours === 1) {
    return "1 час";
  }
  if (hours >= 2 && hours <= 4) {
    return `${hours} часа`;
  }
  return `${hours} часов`;
}

@Injectable()
export class AppointmentReminderDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushSend: PushSendService,
  ) {}

  async dispatchDue(params: {
    userId?: string;
  }): Promise<{ cancelled: number; sent: number }> {
    const reminders = await this.prisma.appointmentReminder.findMany({
      where: {
        status: ReminderStatus.pending,
        remindAt: { lte: new Date() },
        ...(params.userId ? { userId: params.userId } : {}),
      },
      orderBy: { remindAt: "asc" },
    });

    if (reminders.length === 0) {
      return { cancelled: 0, sent: 0 };
    }

    const appointmentIds = [...new Set(reminders.map((r) => r.appointmentId))];
    const appointments = await this.prisma.appointment.findMany({
      where: { id: { in: appointmentIds } },
      select: {
        id: true,
        userId: true,
        clientName: true,
        serviceName: true,
        appointmentAt: true,
        status: true,
      },
    });

    const appointmentsMap = new Map(appointments.map((a) => [a.id, a]));

    let sent = 0;
    let cancelled = 0;
    const now = Date.now();

    for (const reminder of reminders) {
      const appointment = appointmentsMap.get(reminder.appointmentId);
      const appointmentAtTime = appointment?.appointmentAt
        ? appointment.appointmentAt.getTime()
        : Number.NaN;

      if (
        !appointment ||
        appointment.status !== AppointmentStatus.booked ||
        !appointment.appointmentAt ||
        Number.isNaN(appointmentAtTime) ||
        appointmentAtTime <= now
      ) {
        await this.prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: {
            cancelledAt: new Date(),
            status: ReminderStatus.cancelled,
          },
        });
        cancelled += 1;
        continue;
      }

      const result = await this.pushSend.sendOwnerPushNotification({
        ownerUserId: reminder.userId,
        payload: {
          body: `${appointment.clientName} - ${appointment.serviceName}`,
          requireInteraction: reminder.offsetMinutes <= 15,
          tag: `appointment-reminder-${reminder.appointmentId}-${reminder.offsetMinutes}`,
          title: `Запись через ${formatOffsetLabel(reminder.offsetMinutes)}`,
          url: "/receptions",
        },
      });

      if (result.sent > 0) {
        await this.prisma.appointmentReminder.update({
          where: { id: reminder.id },
          data: {
            sentAt: new Date(),
            status: ReminderStatus.sent,
          },
        });
        sent += 1;
        continue;
      }

      if (result.skipped || result.failed > 0) {
        continue;
      }

      await this.prisma.appointmentReminder.update({
        where: { id: reminder.id },
        data: {
          cancelledAt: new Date(),
          status: ReminderStatus.cancelled,
        },
      });
      cancelled += 1;
    }

    return { cancelled, sent };
  }
}
