import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DiscountSourceType, Prisma } from "@prisma/client";
import { isNormalizedPhone, normalizePhone } from "../../common/utils/normalize-phone";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { DiscountResponse, toDiscountResponse } from "./discounts.types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ListDiscountsFilters = {
  phone?: string | null;
  serviceId?: string | null;
  isUsed?: boolean;
};

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOwner(
    userId: string,
    filters: ListDiscountsFilters,
  ): Promise<DiscountResponse[]> {
    const normalizedPhone = filters.phone
      ? normalizePhone(filters.phone)
      : null;
    if (filters.phone && !isNormalizedPhone(normalizedPhone ?? "")) {
      return [];
    }

    const serviceId =
      filters.serviceId && UUID_RE.test(filters.serviceId)
        ? filters.serviceId
        : null;
    if (filters.serviceId && !serviceId) {
      return [];
    }

    const where: Prisma.ClientDiscountWhereInput = { userId };
    if (normalizedPhone) {
      where.clientPhone = normalizedPhone;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (filters.isUsed === true) {
      where.isUsed = true;
    }
    if (filters.isUsed === false) {
      where.isUsed = false;
    }

    const rows = await this.prisma.clientDiscount.findMany({
      where,
      orderBy: [{ isUsed: "asc" }, { createdAt: "desc" }],
    });

    const now = Date.now();
    const filtered =
      filters.isUsed === false
        ? rows.filter((item) => {
            const expiresAt = item.expiresAt?.getTime() ?? null;
            return expiresAt === null || expiresAt > now;
          })
        : rows;

    return filtered.map(toDiscountResponse);
  }

  async createManualForOwner(
    userId: string,
    dto: CreateDiscountDto,
  ): Promise<DiscountResponse> {
    const normalizedPhone = normalizePhone(dto.client_phone);
    if (!isNormalizedPhone(normalizedPhone)) {
      throw new BadRequestException(
        "Телефон клиента должен быть в формате 7XXXXXXXXXX",
      );
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.service_id, userId },
    });
    if (!service) {
      throw new BadRequestException("Услуга для скидки не найдена");
    }

    let expiresAt: Date | null = null;
    if (dto.expires_at !== undefined && dto.expires_at !== null) {
      expiresAt = new Date(dto.expires_at);
      if (Number.isNaN(expiresAt.getTime())) {
        throw new BadRequestException("Некорректная дата expires_at");
      }
    }

    const note =
      dto.note === undefined || dto.note === null
        ? null
        : dto.note.trim() || null;

    const row = await this.prisma.clientDiscount.create({
      data: {
        userId,
        clientPhone: normalizedPhone,
        feedbackToken: null,
        discountPercent: dto.discount_percent,
        sourceType: DiscountSourceType.manual,
        note,
        expiresAt,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
      },
    });

    return toDiscountResponse(row);
  }

  async markUsedForOwner(userId: string, id: string): Promise<DiscountResponse> {
    const result = await this.prisma.clientDiscount.updateMany({
      where: {
        id,
        userId,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
        reservedAt: null,
        reservedForAppointmentId: null,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Скидка не найдена");
    }

    const row = await this.prisma.clientDiscount.findUniqueOrThrow({
      where: { id },
    });
    return toDiscountResponse(row);
  }
}
