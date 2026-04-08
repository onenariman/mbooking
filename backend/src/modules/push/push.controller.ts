import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AppointmentStatus } from "@prisma/client";
import type { Request } from "express";
import {
  CurrentUser,
  type JwtRequestUser,
} from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OwnerRoleGuard } from "../../common/guards/owner-role.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { buildAppointmentEventPayload } from "./appointment-event-push.util";
import { AppointmentReminderDispatchService } from "./appointment-reminder-dispatch.service";
import {
  ALLOWED_REMINDER_OFFSETS,
  AppointmentRemindersSyncService,
  MAX_REMINDER_OFFSETS,
  normalizeReminderOffsets,
} from "./appointment-reminders-sync.service";
import { AppointmentEventPushDto } from "./dto/appointment-event-push.dto";
import { PatchPushSettingsDto } from "./dto/patch-push-settings.dto";
import { SubscribePushDto } from "./dto/subscribe-push.dto";
import { SyncReminderDto } from "./dto/sync-reminder.dto";
import { UnsubscribePushDto } from "./dto/unsubscribe-push.dto";
import { RemindersDispatchAuthGuard } from "./guards/reminders-dispatch-auth.guard";
import { PushSendService } from "./push-send.service";

const OWNER_AUDIENCE = "owner";

type DispatchRequest = Request & {
  reminderDispatchMode?: "all" | "self";
  user?: JwtRequestUser;
};

@Controller("push")
export class PushController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reminderSync: AppointmentRemindersSyncService,
    private readonly reminderDispatch: AppointmentReminderDispatchService,
    private readonly pushSend: PushSendService,
  ) {}

  @Post("subscribe")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser("sub") userId: string,
    @Body() dto: SubscribePushDto,
  ) {
    await this.prisma.pushSubscription.upsert({
      where: {
        authUserId_ownerUserId_endpoint: {
          authUserId: userId,
          ownerUserId: userId,
          endpoint: dto.subscription.endpoint,
        },
      },
      create: {
        audience: OWNER_AUDIENCE,
        authUserId: userId,
        ownerUserId: userId,
        endpoint: dto.subscription.endpoint,
        p256dh: dto.subscription.keys.p256dh,
        auth: dto.subscription.keys.auth,
      },
      update: {
        p256dh: dto.subscription.keys.p256dh,
        auth: dto.subscription.keys.auth,
      },
    });
    return { data: true };
  }

  @Delete("subscribe")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @CurrentUser("sub") userId: string,
    @Body() dto: UnsubscribePushDto,
  ) {
    await this.prisma.pushSubscription.deleteMany({
      where: {
        authUserId: userId,
        ownerUserId: userId,
        audience: OWNER_AUDIENCE,
        endpoint: dto.endpoint,
      },
    });
    return { data: true };
  }

  @Get("settings")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  async getSettings(@CurrentUser("sub") userId: string) {
    const settings = await this.prisma.ownerNotificationSettings.findUnique({
      where: { userId },
    });
    const reminder_offsets_minutes = normalizeReminderOffsets(
      settings?.reminderOffsetsMinutes ?? null,
      {
        fallbackToDefault: !Array.isArray(settings?.reminderOffsetsMinutes),
      },
    );
    return {
      data: {
        allowed_offsets_minutes: [...ALLOWED_REMINDER_OFFSETS],
        max_selected: MAX_REMINDER_OFFSETS,
        reminder_offsets_minutes,
      },
    };
  }

  @Patch("settings")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  async patchSettings(
    @CurrentUser("sub") userId: string,
    @Body() dto: PatchPushSettingsDto,
  ) {
    const reminder_offsets_minutes = normalizeReminderOffsets(
      dto.reminder_offsets_minutes,
      { fallbackToDefault: false },
    );

    await this.prisma.ownerNotificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        reminderOffsetsMinutes: reminder_offsets_minutes,
      },
      update: {
        reminderOffsetsMinutes: reminder_offsets_minutes,
      },
    });

    const sync = await this.reminderSync.syncAllForUser(userId);

    return {
      data: {
        allowed_offsets_minutes: [...ALLOWED_REMINDER_OFFSETS],
        max_selected: MAX_REMINDER_OFFSETS,
        reminder_offsets_minutes,
        sync: {
          total_created: sync.total_created,
          total_cancelled: sync.total_cancelled,
        },
      },
    };
  }

  @Post("reminders/sync")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @HttpCode(HttpStatus.OK)
  async syncReminder(
    @CurrentUser("sub") userId: string,
    @Body() dto: SyncReminderDto,
  ) {
    const result = await this.reminderSync.syncForAppointment({
      appointmentId: dto.appointment_id,
      userId,
    });
    return { data: result };
  }

  @Get("reminders/dispatch")
  @Post("reminders/dispatch")
  @UseGuards(RemindersDispatchAuthGuard)
  @HttpCode(HttpStatus.OK)
  async dispatchReminders(@Req() req: DispatchRequest) {
    const mode = req.reminderDispatchMode ?? "self";
    const userId = mode === "all" ? undefined : req.user?.sub;
    const result = await this.reminderDispatch.dispatchDue({
      userId,
    });
    return {
      data: {
        mode,
        cancelled: result.cancelled,
        sent: result.sent,
      },
    };
  }

  @Post("test")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @HttpCode(HttpStatus.OK)
  async testPush(@CurrentUser("sub") userId: string) {
    if (!this.pushSend.isConfigured()) {
      throw new BadRequestException(
        "Push не настроен на сервере. Добавьте VAPID_PUBLIC_KEY (или NEXT_PUBLIC_VAPID_PUBLIC_KEY), VAPID_PRIVATE_KEY и VAPID_SUBJECT.",
      );
    }

    const result = await this.pushSend.sendOwnerPushNotification({
      ownerUserId: userId,
      payload: {
        body: "Если вы видите это уведомление, push для мастера уже работает.",
        requireInteraction: true,
        tag: "owner-test-push",
        title: "Тестовое уведомление",
        url: "/receptions",
      },
    });

    if (result.sent === 0) {
      throw new BadRequestException(
        "Нет активных подписок. Сначала включите уведомления в браузере.",
      );
    }

    return { data: result };
  }

  @Post("appointments/event")
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @HttpCode(HttpStatus.OK)
  async appointmentEvent(
    @CurrentUser("sub") userId: string,
    @Body() dto: AppointmentEventPushDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: dto.appointment_id, userId },
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        serviceName: true,
        status: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException("Запись не найдена");
    }

    if (
      (dto.event === "created" || dto.event === "rescheduled") &&
      appointment.status !== AppointmentStatus.booked
    ) {
      return { data: { skipped: true } };
    }

    if (
      dto.event === "cancelled" &&
      appointment.status !== AppointmentStatus.cancelled
    ) {
      return { data: { skipped: true } };
    }

    const payload = buildAppointmentEventPayload({
      appointment: {
        id: appointment.id,
        client_name: appointment.clientName,
        service_name: appointment.serviceName,
      },
      appointmentLabel: dto.appointment_label,
      event: dto.event,
    });

    const ownerResult = await this.pushSend.sendOwnerPushNotification({
      ownerUserId: userId,
      payload: {
        ...payload,
        url: "/receptions",
      },
    });

    const links = await this.prisma.clientPortalLink.findMany({
      where: {
        ownerUserId: userId,
        clientPhone: appointment.clientPhone,
        isActive: true,
      },
      select: { clientAuthUserId: true },
    });

    const recipients = [...new Set(links.map((link) => link.clientAuthUserId))];
    const enabledProfiles = recipients.length
      ? await this.prisma.clientPortalProfile.findMany({
          where: {
            authUserId: { in: recipients },
            notificationsEnabled: true,
          },
          select: { authUserId: true },
        })
      : [];

    let clientSent = 0;
    let clientFailed = 0;
    let clientSkipped = false;

    for (const profile of enabledProfiles) {
      const clientResult = await this.pushSend.sendClientPortalPushNotification({
        ownerUserId: userId,
        clientAuthUserId: profile.authUserId,
        payload: {
          ...payload,
          url: "/client",
        },
      });
      clientSent += clientResult.sent;
      clientFailed += clientResult.failed;
      if (clientResult.skipped) {
        clientSkipped = true;
      }
    }

    return {
      data: {
        ...ownerResult,
        client_portal: {
          recipients: enabledProfiles.length,
          sent: clientSent,
          failed: clientFailed,
          skipped: clientSkipped,
        },
      },
    };
  }
}
