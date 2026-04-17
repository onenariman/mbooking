import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AppointmentStatus } from "@prisma/client";
import { normalizePhone } from "../../common/utils/normalize-phone";
import { toAppointmentResponse } from "../appointments/appointments.types";
import { toDiscountResponse } from "../discounts/discounts.types";
import {
  AppointmentRemindersSyncService,
  normalizeClientReminderOffsets,
} from "../push/appointment-reminders-sync.service";
import { PrismaService } from "../../prisma/prisma.service";
import type { ClientSettingsDto } from "./dto/client-settings.dto";

@Injectable()
export class ClientPortalContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly remindersSync: AppointmentRemindersSyncService,
  ) {}

  async getContextOrThrow(authUserId: string) {
    const profile = await this.prisma.clientPortalProfile.findUnique({
      where: { authUserId },
    });
    if (!profile) {
      throw new ForbiddenException("Клиентский кабинет не активирован");
    }

    const links = await this.prisma.clientPortalLink.findMany({
      where: { clientAuthUserId: authUserId, isActive: true },
      orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    });
    if (!links.length) {
      throw new ForbiddenException("Клиентский кабинет не активирован");
    }

    const activeLink = links[0];
    const clientPhone =
      normalizePhone(activeLink.clientPhone) || normalizePhone(profile.phone);
    if (!clientPhone) {
      throw new ForbiddenException("Клиентский кабинет не активирован");
    }

    return {
      authUserId,
      profile,
      links,
      activeLink,
      clientPhone,
      ownerUserId: activeLink.ownerUserId,
      clientId: activeLink.clientId,
    };
  }

  async touchSession(context: {
    authUserId: string;
    activeLink: { id: string };
  }) {
    const now = new Date();
    await Promise.allSettled([
      this.prisma.clientPortalProfile.update({
        where: { authUserId: context.authUserId },
        data: { lastLoginAt: now },
      }),
      this.prisma.clientPortalLink.update({
        where: { id: context.activeLink.id },
        data: { lastSeenAt: now },
      }),
    ]);
  }

  async me(context: {
    authUserId: string;
    profile: {
      displayName: string | null;
      notificationsEnabled: boolean;
      clientReminderOffsetsMinutes: number[];
      quietHoursStartUtc: string | null;
      quietHoursEndUtc: string | null;
    };
    links: Array<unknown>;
    ownerUserId: string;
    clientPhone: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: context.authUserId },
      select: { email: true },
    });

    return {
      auth_user_id: context.authUserId,
      phone: context.clientPhone,
      email: user?.email ?? null,
      display_name: context.profile.displayName,
      notifications_enabled: context.profile.notificationsEnabled,
      client_reminder_offsets_minutes:
        context.profile.clientReminderOffsetsMinutes ?? [],
      quiet_hours_start_utc: context.profile.quietHoursStartUtc ?? null,
      quiet_hours_end_utc: context.profile.quietHoursEndUtc ?? null,
      active_owner_user_id: context.ownerUserId,
      linked_businesses_count: context.links.length,
    };
  }

  async appointments(context: { ownerUserId: string; clientPhone: string }) {
    const rows = await this.prisma.appointment.findMany({
      where: {
        userId: context.ownerUserId,
        clientPhone: context.clientPhone,
      },
      orderBy: { appointmentAt: "asc" },
    });
    const mapped = rows.map(toAppointmentResponse);
    const now = Date.now();
    const upcoming = mapped.filter((item) => {
      if (item.status !== AppointmentStatus.booked || !item.appointment_at) {
        return false;
      }
      return new Date(item.appointment_at).getTime() >= now;
    });
    const history = mapped
      .filter((item) => !upcoming.some((u) => u.id === item.id))
      .sort((a, b) => {
        const at = new Date(a.appointment_at ?? a.created_at).getTime();
        const bt = new Date(b.appointment_at ?? b.created_at).getTime();
        return bt - at;
      })
      .slice(0, 20);

    return { upcoming, history };
  }

  async discounts(context: { ownerUserId: string; clientPhone: string }) {
    const rows = await this.prisma.clientDiscount.findMany({
      where: {
        userId: context.ownerUserId,
        clientPhone: context.clientPhone,
      },
      orderBy: [{ isUsed: "asc" }, { createdAt: "desc" }],
    });
    const mapped = rows.map(toDiscountResponse);
    const now = Date.now();
    const active = mapped.filter((d) => {
      if (d.is_used) {
        return false;
      }
      if (!d.expires_at) {
        return true;
      }
      return new Date(d.expires_at).getTime() > now;
    });
    const archive = mapped.filter((d) => {
      if (d.is_used) {
        return true;
      }
      if (!d.expires_at) {
        return false;
      }
      return new Date(d.expires_at).getTime() <= now;
    });

    return { active, archive };
  }

  async updateSettings(authUserId: string, dto: ClientSettingsDto) {
    if (
      dto.notifications_enabled === undefined &&
      dto.email === undefined &&
      dto.client_reminder_offsets_minutes === undefined &&
      dto.quiet_hours_start_utc === undefined &&
      dto.quiet_hours_end_utc === undefined
    ) {
      throw new BadRequestException("Нет полей для обновления");
    }

    if (dto.email !== undefined) {
      const next = dto.email.trim().toLowerCase();
      const taken = await this.prisma.user.findFirst({
        where: { email: next, NOT: { id: authUserId } },
      });
      if (taken) {
        throw new ConflictException("Этот email уже занят");
      }
      await this.prisma.user.update({
        where: { id: authUserId },
        data: { email: next },
      });
    }

    const profileData: {
      notificationsEnabled?: boolean;
      clientReminderOffsetsMinutes?: number[];
      quietHoursStartUtc?: string | null;
      quietHoursEndUtc?: string | null;
    } = {};

    if (dto.notifications_enabled !== undefined) {
      profileData.notificationsEnabled = dto.notifications_enabled;
    }

    if (dto.client_reminder_offsets_minutes !== undefined) {
      profileData.clientReminderOffsetsMinutes = normalizeClientReminderOffsets(
        dto.client_reminder_offsets_minutes,
      );
    }

    if (dto.quiet_hours_start_utc !== undefined) {
      profileData.quietHoursStartUtc = dto.quiet_hours_start_utc;
    }
    if (dto.quiet_hours_end_utc !== undefined) {
      profileData.quietHoursEndUtc = dto.quiet_hours_end_utc;
    }

    if (Object.keys(profileData).length > 0) {
      await this.prisma.clientPortalProfile.update({
        where: { authUserId },
        data: profileData,
      });
    }

    if (
      dto.client_reminder_offsets_minutes !== undefined ||
      dto.quiet_hours_start_utc !== undefined ||
      dto.quiet_hours_end_utc !== undefined
    ) {
      const links = await this.prisma.clientPortalLink.findMany({
        where: { clientAuthUserId: authUserId, isActive: true },
        select: { ownerUserId: true },
      });
      const ownerIds = [...new Set(links.map((l) => l.ownerUserId))];
      for (const oid of ownerIds) {
        await this.remindersSync.syncAllForUser(oid);
      }
    }

    const row = await this.prisma.clientPortalProfile.findUniqueOrThrow({
      where: { authUserId },
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: authUserId },
      select: { email: true },
    });

    return {
      auth_user_id: row.authUserId,
      phone: row.phone,
      email: user.email,
      display_name: row.displayName,
      notifications_enabled: row.notificationsEnabled,
      client_reminder_offsets_minutes: row.clientReminderOffsetsMinutes ?? [],
      quiet_hours_start_utc: row.quietHoursStartUtc ?? null,
      quiet_hours_end_utc: row.quietHoursEndUtc ?? null,
      created_at: row.createdAt.toISOString(),
      last_login_at: row.lastLoginAt?.toISOString() ?? null,
    };
  }
}
