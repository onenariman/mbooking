import { ForbiddenException, Injectable } from "@nestjs/common";
import { AppointmentStatus } from "@prisma/client";
import { normalizePhone } from "../../common/utils/normalize-phone";
import { toAppointmentResponse } from "../appointments/appointments.types";
import { toDiscountResponse } from "../discounts/discounts.types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClientPortalContextService {
  constructor(private readonly prisma: PrismaService) {}

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
    profile: { displayName: string | null; notificationsEnabled: boolean };
    links: Array<unknown>;
    ownerUserId: string;
    clientPhone: string;
  }) {
    return {
      auth_user_id: context.authUserId,
      phone: context.clientPhone,
      display_name: context.profile.displayName,
      notifications_enabled: context.profile.notificationsEnabled,
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

  async updateSettings(authUserId: string, dto: { notifications_enabled?: boolean }) {
    if (dto.notifications_enabled === undefined) {
      throw new ForbiddenException("Нет полей для обновления");
    }
    const row = await this.prisma.clientPortalProfile.update({
      where: { authUserId },
      data: { notificationsEnabled: dto.notifications_enabled },
    });
    return {
      auth_user_id: row.authUserId,
      phone: row.phone,
      display_name: row.displayName,
      notifications_enabled: row.notificationsEnabled,
      created_at: row.createdAt.toISOString(),
      last_login_at: row.lastLoginAt?.toISOString() ?? null,
    };
  }
}
