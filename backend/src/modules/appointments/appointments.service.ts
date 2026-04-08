import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { isNormalizedPhone, normalizePhone } from "../../common/utils/normalize-phone";
import { PrismaService } from "../../prisma/prisma.service";
import { AppointmentRemindersSyncService } from "../push/appointment-reminders-sync.service";
import { AppointmentResponse, toAppointmentResponse } from "./appointments.types";
import { CompleteAppointmentDto } from "./dto/complete-appointment.dto";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

const DEFAULT_CATEGORY_NAME = "Без категории";
const DEFAULT_FEEDBACK_EXPIRES_DAYS = 14;

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reminderSync: AppointmentRemindersSyncService,
    private readonly configService: ConfigService,
  ) {}

  async listForOwner(userId: string): Promise<AppointmentResponse[]> {
    const rows = await this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { appointmentAt: "asc" },
    });
    return rows.map(toAppointmentResponse);
  }

  async createForOwner(
    userId: string,
    dto: CreateAppointmentDto,
  ): Promise<AppointmentResponse> {
    const clientPhone = this.normalizePhoneOrThrow(dto.client_phone);
    const serviceId = dto.service_id;
    await this.ensureServiceOwnership(userId, serviceId);

    const appointmentAt = this.parseDateOrThrow(
      dto.appointment_at,
      "Invalid appointment_at",
    );
    const appointmentEnd = this.parseDateOrThrow(
      dto.appointment_end,
      "Invalid appointment_end",
    );
    this.assertDateRange(appointmentAt, appointmentEnd);

    const data: Prisma.AppointmentCreateInput = {
      userId,
      clientName: dto.client_name.trim(),
      clientPhone,
      serviceId,
      serviceName: dto.service_name.trim(),
      categoryName: (dto.category_name ?? DEFAULT_CATEGORY_NAME).trim(),
      appointmentAt,
      appointmentEnd,
      appliedDiscountId: dto.applied_discount_id ?? null,
      status: dto.status ?? AppointmentStatus.booked,
      amount: this.toDecimalOrNull(dto.amount),
      notes: dto.notes ?? null,
    };

    try {
      const row = await this.prisma.appointment.create({ data });
      return toAppointmentResponse(row);
    } catch (e) {
      this.rethrowOverlap(e);
      throw e;
    }
  }

  async updateForOwner(
    userId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponse> {
    if (
      dto.client_name === undefined &&
      dto.client_phone === undefined &&
      dto.service_id === undefined &&
      dto.service_name === undefined &&
      dto.category_name === undefined &&
      dto.appointment_at === undefined &&
      dto.appointment_end === undefined &&
      dto.applied_discount_id === undefined &&
      dto.status === undefined &&
      dto.amount === undefined &&
      dto.notes === undefined
    ) {
      throw new BadRequestException("No fields to update");
    }

    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }

    const data: Prisma.AppointmentUpdateInput = {};

    if (dto.client_name !== undefined) {
      const value = dto.client_name.trim();
      if (!value) {
        throw new BadRequestException("Client name is required");
      }
      data.clientName = value;
    }
    if (dto.client_phone !== undefined) {
      data.clientPhone = this.normalizePhoneOrThrow(dto.client_phone);
    }
    if (dto.service_id !== undefined) {
      const serviceId = dto.service_id;
      if (serviceId !== null) {
        await this.ensureServiceOwnership(userId, serviceId);
      }
      data.serviceId = serviceId;
    }
    if (dto.service_name !== undefined) {
      const value = dto.service_name.trim();
      if (!value) {
        throw new BadRequestException("Service name is required");
      }
      data.serviceName = value;
    }
    if (dto.category_name !== undefined) {
      data.categoryName = (dto.category_name || DEFAULT_CATEGORY_NAME).trim();
    }
    if (dto.appointment_at !== undefined) {
      data.appointmentAt =
        dto.appointment_at === null
          ? null
          : this.parseDateOrThrow(dto.appointment_at, "Invalid appointment_at");
    }
    if (dto.appointment_end !== undefined) {
      data.appointmentEnd =
        dto.appointment_end === null
          ? null
          : this.parseDateOrThrow(dto.appointment_end, "Invalid appointment_end");
    }
    if (dto.applied_discount_id !== undefined) {
      data.appliedDiscountId = dto.applied_discount_id;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.amount !== undefined) {
      data.amount = this.toDecimalOrNull(dto.amount);
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    const start = (data.appointmentAt as Date | null | undefined) ?? existing.appointmentAt;
    const end = (data.appointmentEnd as Date | null | undefined) ?? existing.appointmentEnd;
    if (start !== null && end !== null) {
      this.assertDateRange(start, end);
    }

    try {
      const row = await this.prisma.appointment.update({
        where: { id },
        data,
      });
      return toAppointmentResponse(row);
    } catch (e) {
      this.rethrowOverlap(e);
      throw e;
    }
  }

  async deleteForOwner(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.prisma.appointment.delete({ where: { id } });
  }

  /**
   * Завершение визита: суммы/скидка, синхронизация reminders, выдача feedback token.
   * Повторяет логику `app/api/appointments/[id]/complete/route.ts`.
   */
  async completeForOwner(
    userId: string,
    id: string,
    dto: CompleteAppointmentDto,
  ): Promise<{ feedback_token: string; feedback_url: string }> {
    const feedbackToken = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id, userId },
        select: {
          id: true,
          clientPhone: true,
          serviceId: true,
          serviceName: true,
          status: true,
          appliedDiscountId: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException("Запись не найдена");
      }

      if (appointment.status === AppointmentStatus.completed) {
        throw new BadRequestException("Запись уже завершена");
      }

      const shouldApplyDiscount =
        Boolean(appointment.appliedDiscountId) && !dto.ignore_discount;
      const now = new Date();

      let updateData: Prisma.AppointmentUpdateInput;

      if (shouldApplyDiscount) {
        const serviceAmount = dto.service_amount;
        const extraAmount = dto.extra_amount ?? 0;

        if (serviceAmount === undefined || serviceAmount === null) {
          throw new BadRequestException(
            "Укажите стоимость услуги для расчета скидки",
          );
        }

        const discount = await tx.clientDiscount.findFirst({
          where: {
            id: appointment.appliedDiscountId!,
            userId,
          },
        });

        if (!discount) {
          throw new BadRequestException("Выбранная скидка не найдена");
        }

        if (discount.clientPhone !== appointment.clientPhone) {
          throw new BadRequestException("Скидка привязана к другому клиенту");
        }

        if (
          discount.serviceId &&
          appointment.serviceId !== discount.serviceId
        ) {
          const label =
            discount.serviceNameSnapshot ?? appointment.serviceName;
          throw new BadRequestException(
            `Скидка действует только на услугу "${label}"`,
          );
        }

        if (discount.isUsed) {
          throw new BadRequestException("Эта скидка уже была использована");
        }

        if (
          discount.expiresAt &&
          discount.expiresAt.getTime() <= Date.now()
        ) {
          throw new BadRequestException("Срок действия скидки истек");
        }

        const discountAmount = Math.round(
          (serviceAmount * discount.discountPercent) / 100,
        );
        const finalAmount =
          Math.max(serviceAmount - discountAmount, 0) + extraAmount;

        updateData = {
          amount: new Prisma.Decimal(finalAmount),
          discountAmount: new Prisma.Decimal(discountAmount),
          extraAmount: new Prisma.Decimal(extraAmount),
          serviceAmount: new Prisma.Decimal(serviceAmount),
          status: AppointmentStatus.completed,
        };
      } else {
        const amount = dto.amount;
        if (amount === undefined || amount === null) {
          throw new BadRequestException("Укажите итоговую стоимость");
        }

        updateData = {
          amount: new Prisma.Decimal(amount),
          status: AppointmentStatus.completed,
          ...(appointment.appliedDiscountId && dto.ignore_discount
            ? {
                appliedDiscountId: null,
                discountAmount: null,
                extraAmount: null,
                serviceAmount: null,
              }
            : {}),
        };
      }

      await tx.appointment.update({
        where: { id },
        data: updateData,
      });

      if (shouldApplyDiscount) {
        const consume = await tx.clientDiscount.updateMany({
          where: {
            id: appointment.appliedDiscountId!,
            userId,
            isUsed: false,
          },
          data: {
            isUsed: true,
            reservedAt: null,
            reservedForAppointmentId: null,
            usedAt: now,
            usedOnAppointmentId: id,
          },
        });

        if (consume.count === 0) {
          throw new InternalServerErrorException(
            "Визит завершен, но скидку не удалось списать. Проверьте скидки клиента вручную.",
          );
        }
      }

      const existingToken = await tx.feedbackToken.findFirst({
        where: {
          userId,
          appointmentId: id,
          isActive: true,
          usedAt: null,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingToken?.token) {
        return existingToken.token;
      }

      const createdToken = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + DEFAULT_FEEDBACK_EXPIRES_DAYS);

      await tx.feedbackToken.create({
        data: {
          userId,
          appointmentId: id,
          token: createdToken,
          expiresAt,
        },
      });

      return createdToken;
    });

    try {
      await this.reminderSync.syncForAppointment({
        appointmentId: id,
        userId,
      });
    } catch (err) {
      this.logger.error(
        "Failed to sync appointment reminders after completion",
        err instanceof Error ? err.stack : String(err),
      );
    }

    const baseUrl = this.configService
      .getOrThrow<string>("app.publicBaseUrl")
      .replace(/\/$/, "");
    const feedback_url = `${baseUrl}/feedback/${feedbackToken}`;

    return {
      feedback_token: feedbackToken,
      feedback_url,
    };
  }

  private normalizePhoneOrThrow(value: string): string {
    const normalized = normalizePhone(value);
    if (!isNormalizedPhone(normalized)) {
      throw new BadRequestException("Invalid phone format");
    }
    return normalized;
  }

  private parseDateOrThrow(value: string, message: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(message);
    }
    return date;
  }

  private assertDateRange(start: Date, end: Date): void {
    if (!(end > start)) {
      throw new BadRequestException("appointment_end must be after appointment_at");
    }
  }

  private toDecimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Number.isFinite(value)) {
      throw new BadRequestException("Invalid amount");
    }
    return new Prisma.Decimal(value);
  }

  private async ensureServiceOwnership(
    userId: string,
    serviceId: string,
  ): Promise<void> {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new BadRequestException("Service not found");
    }
    if (service.userId !== userId) {
      throw new ForbiddenException();
    }
  }

  private rethrowOverlap(e: unknown): void {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new ConflictException("Selected slot is already occupied");
    }
  }
}
