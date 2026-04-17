import { Injectable } from "@nestjs/common";
import {
  AppointmentStatus,
  ReminderRecipient,
  ReminderStatus,
} from "@prisma/client";
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

/** Пустой массив = не слать клиенту напоминания */
export function normalizeClientReminderOffsets(
  offsets: number[] | null | undefined,
): number[] {
  if (!Array.isArray(offsets) || offsets.length === 0) {
    return [];
  }
  return normalizeReminderOffsets(offsets, { fallbackToDefault: false });
}

function parseUtcHm(s: string | null | undefined): number | null {
  if (!s || !/^\d{2}:\d{2}$/.test(s)) {
    return null;
  }
  const [h, m] = s.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
}

/** Если remindAt попадает в окно тишины UTC — сдвинуть на конец окна (тот же или следующий день). */
export function adjustRemindAtForQuietHoursUtc(
  remindAt: Date,
  quietStart: string | null | undefined,
  quietEnd: string | null | undefined,
): Date {
  const startM = parseUtcHm(quietStart ?? null);
  const endM = parseUtcHm(quietEnd ?? null);
  if (startM === null || endM === null) {
    return remindAt;
  }

  const d = new Date(remindAt);
  const mins =
    d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;

  const inQuiet = (m: number): boolean => {
    if (startM < endM) {
      return m >= startM && m < endM;
    }
    return m >= startM || m < endM;
  };

  if (!inQuiet(mins)) {
    return remindAt;
  }

  const endHour = Math.floor(endM / 60);
  const endMin = endM % 60;
  const out = new Date(d);
  out.setUTCHours(endHour, endMin, 0, 0);
  if (out.getTime() <= d.getTime()) {
    out.setUTCDate(out.getUTCDate() + 1);
  }
  return out;
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
        clientPhone: true,
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

    const ownerOffsets = normalizeReminderOffsets(
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

    const link = await this.prisma.clientPortalLink.findFirst({
      where: {
        ownerUserId: userId,
        clientPhone: appointment.clientPhone,
        isActive: true,
      },
      orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    });

    let clientOffsets: number[] = [];
    let quietStart: string | null = null;
    let quietEnd: string | null = null;

    if (link) {
      const profile = await this.prisma.clientPortalProfile.findUnique({
        where: { authUserId: link.clientAuthUserId },
      });
      if (profile) {
        clientOffsets = normalizeClientReminderOffsets(
          profile.clientReminderOffsetsMinutes,
        );
        quietStart = profile.quietHoursStartUtc;
        quietEnd = profile.quietHoursEndUtc;
      }
    }

    let created = 0;
    let cancelled = 0;

    const ownerResult = await this.syncRecipientBlock({
      appointmentId,
      userId,
      appointmentTime,
      now,
      offsets: ownerOffsets,
      recipient: ReminderRecipient.owner,
      existing,
      adjustQuiet: null,
    });
    created += ownerResult.created;
    cancelled += ownerResult.cancelled;

    const clientResult = await this.syncRecipientBlock({
      appointmentId,
      userId,
      appointmentTime,
      now,
      offsets: clientOffsets,
      recipient: ReminderRecipient.client,
      existing,
      adjustQuiet:
        quietStart && quietEnd
          ? { start: quietStart, end: quietEnd }
          : null,
    });
    created += clientResult.created;
    cancelled += clientResult.cancelled;

    return { created, cancelled };
  }

  private async syncRecipientBlock(params: {
    appointmentId: string;
    userId: string;
    appointmentTime: number;
    now: number;
    offsets: number[];
    recipient: ReminderRecipient;
    existing: Array<{
      id: string;
      offsetMinutes: number;
      recipient: ReminderRecipient;
      status: ReminderStatus;
    }>;
    adjustQuiet: { start: string; end: string } | null;
  }): Promise<{ created: number; cancelled: number }> {
    const {
      appointmentId,
      userId,
      appointmentTime,
      now,
      offsets,
      recipient,
      existing,
      adjustQuiet,
    } = params;

    const existingForRecipient = existing.filter((r) => r.recipient === recipient);

    let desiredRows = offsets.map((offset) => {
      let remindAt = new Date(appointmentTime - offset * 60_000);
      if (adjustQuiet) {
        remindAt = adjustRemindAtForQuietHoursUtc(
          remindAt,
          adjustQuiet.start,
          adjustQuiet.end,
        );
      }
      return {
        appointmentId,
        offsetMinutes: offset,
        remindAt,
        userId,
        recipient,
      };
    });

    desiredRows = desiredRows.filter((row) => row.remindAt.getTime() > now);

    const desiredOffsets = new Set(desiredRows.map((row) => row.offsetMinutes));
    const obsoleteIds = existingForRecipient
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
          appointmentId_offsetMinutes_recipient: {
            appointmentId: row.appointmentId,
            offsetMinutes: row.offsetMinutes,
            recipient: row.recipient,
          },
        },
        create: {
          appointmentId: row.appointmentId,
          userId: row.userId,
          offsetMinutes: row.offsetMinutes,
          recipient: row.recipient,
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
