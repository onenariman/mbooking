import { Injectable } from "@nestjs/common";
import { AppointmentStatus, ReminderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export const ALLOWED_REMINDER_OFFSETS = [5, 15, 30, 60, 120, 180] as const;
export const DEFAULT_REMINDER_OFFSETS = [60, 5] as const;
export const MAX_REMINDER_OFFSETS = 3;

const allowedOffsetsSet = new Set<number>(ALLOWED_REMINDER_OFFSETS);

export function normalizeReminderOffsets(
  offsets: number[] | null | undefined,
  { fallbackToDefault = true }: { fallbackToDefault?: boolean } = {},
): number[] {
  const source = Array.isArray(offsets)
    ? offsets
    : fallbackToDefault
      ? [...DEFAULT_REMINDER_OFFSETS]
      : [];

  return [...new Set(source)]
    .filter(
      (offset): offset is number =>
        Number.isInteger(offset) && allowedOffsetsSet.has(offset),
    )
    .sort((left, right) => right - left)
    .slice(0, MAX_REMINDER_OFFSETS);
}

@Injectable()
export class AppointmentRemindersSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async syncForAppointment(params: {
    appointmentId: string;
    userId: string;
  }): Promise<{ created: number; cancelled: number }> {
    const { appointmentId, userId } = params;

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, userId },
      select: {
        id: true,
        userId: true,
        clientName: true,
        serviceName: true,
        appointmentAt: true,
        status: true,
      },
    });

    if (!appointment) {
      await this.prisma.appointmentReminder.deleteMany({
        where: { appointmentId, userId },
      });
      return { created: 0, cancelled: 0 };
    }

    const settings = await this.prisma.ownerNotificationSettings.findUnique({
      where: { userId },
    });

    const offsets = normalizeReminderOffsets(
      settings?.reminderOffsetsMinutes ?? null,
      {
        fallbackToDefault: !Array.isArray(settings?.reminderOffsetsMinutes),
      },
    );

    const existing = await this.prisma.appointmentReminder.findMany({
      where: { appointmentId, userId },
    });

    const now = Date.now();

    if (
      appointment.status !== AppointmentStatus.booked ||
      !appointment.appointmentAt
    ) {
      if (existing.length > 0) {
        await this.prisma.appointmentReminder.updateMany({
          where: {
            appointmentId,
            userId,
            status: { not: ReminderStatus.cancelled },
          },
          data: {
            status: ReminderStatus.cancelled,
            cancelledAt: new Date(),
          },
        });
      }
      return { created: 0, cancelled: existing.length };
    }

    const appointmentTime = appointment.appointmentAt.getTime();
    if (Number.isNaN(appointmentTime)) {
      return { created: 0, cancelled: 0 };
    }

    const desiredRows = offsets
      .map((offset) => ({
        appointmentId,
        offsetMinutes: offset,
        remindAt: new Date(appointmentTime - offset * 60_000),
        userId,
      }))
      .filter((row) => row.remindAt.getTime() > now);

    const desiredOffsets = new Set(desiredRows.map((row) => row.offsetMinutes));
    const obsoleteIds = existing
      .filter(
        (row) =>
          !desiredOffsets.has(row.offsetMinutes) &&
          row.status !== ReminderStatus.cancelled,
      )
      .map((row) => row.id);

    if (obsoleteIds.length > 0) {
      await this.prisma.appointmentReminder.updateMany({
        where: { id: { in: obsoleteIds } },
        data: {
          cancelledAt: new Date(),
          status: ReminderStatus.cancelled,
        },
      });
    }

    for (const row of desiredRows) {
      await this.prisma.appointmentReminder.upsert({
        where: {
          appointmentId_offsetMinutes: {
            appointmentId: row.appointmentId,
            offsetMinutes: row.offsetMinutes,
          },
        },
        create: {
          appointmentId: row.appointmentId,
          userId: row.userId,
          offsetMinutes: row.offsetMinutes,
          remindAt: row.remindAt,
          status: ReminderStatus.pending,
        },
        update: {
          remindAt: row.remindAt,
          status: ReminderStatus.pending,
          cancelledAt: null,
          sentAt: null,
        },
      });
    }

    return {
      cancelled: obsoleteIds.length,
      created: desiredRows.length,
    };
  }

  async syncAllForUser(userId: string): Promise<{
    total_created: number;
    total_cancelled: number;
  }> {
    const appointments = await this.prisma.appointment.findMany({
      where: { userId },
      select: { id: true },
      orderBy: { appointmentAt: "asc" },
    });

    let total_created = 0;
    let total_cancelled = 0;

    for (const row of appointments) {
      const result = await this.syncForAppointment({
        appointmentId: row.id,
        userId,
      });
      total_created += result.created;
      total_cancelled += result.cancelled;
    }

    return { total_created, total_cancelled };
  }
}
