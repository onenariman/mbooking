import { Injectable } from "@nestjs/common";
import {
  AppointmentStatus,
  ReminderRecipient,
  ReminderStatus,
} from "@prisma/client";
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

function parseHmUtc(s: string | null | undefined): number | null {
  if (!s || !/^\d{2}:\d{2}$/.test(s)) {
    return null;
  }
  const [h, m] = s.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

/** Текущее UTC-время попадает в окно [start,end) с переходом через полночь */
function isUtcNowInQuietHours(start: string, end: string): boolean {
  const startM = parseHmUtc(start);
  const endM = parseHmUtc(end);
  if (startM === null || endM === null) {
    return false;
  }
  const n = new Date();
  const mins = n.getUTCHours() * 60 + n.getUTCMinutes();
  if (startM < endM) {
    return mins >= startM && mins < endM;
  }
  return mins >= startM || mins < endM;
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
        clientPhone: true,
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

      if (reminder.recipient === ReminderRecipient.client) {
        const link = await this.prisma.clientPortalLink.findFirst({
          where: {
            ownerUserId: reminder.userId,
            clientPhone: appointment.clientPhone,
            isActive: true,
          },
          orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
        });

        if (!link) {
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

        const profile = await this.prisma.clientPortalProfile.findUnique({
          where: { authUserId: link.clientAuthUserId },
        });

        if (
          profile?.quietHoursStartUtc &&
          profile?.quietHoursEndUtc &&
          isUtcNowInQuietHours(
            profile.quietHoursStartUtc,
            profile.quietHoursEndUtc,
          )
        ) {
          continue;
        }

        const result = await this.pushSend.sendClientPortalPushNotification({
          ownerUserId: reminder.userId,
          clientAuthUserId: link.clientAuthUserId,
          payload: {
            body: `${appointment.serviceName}`,
            requireInteraction: reminder.offsetMinutes <= 15,
            tag: `client-appointment-reminder-${reminder.appointmentId}-${reminder.offsetMinutes}`,
            title: `Запись через ${formatOffsetLabel(reminder.offsetMinutes)}`,
            url: "/client",
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
