import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DiscountSourceType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { isNormalizedPhone, normalizePhone } from "../../common/utils/normalize-phone";
import { PrismaService } from "../../prisma/prisma.service";
import { parseFeedbackListQuery } from "./feedback-period.util";
import {
  FeedbackRatingTrendApi,
  FeedbackResponseApi,
  toFeedbackResponseApi,
} from "./feedback.types";
import { CreateFeedbackTokenDto } from "./dto/create-feedback-token.dto";
import { SubmitFeedbackDto } from "./dto/submit-feedback.dto";

function utcDateOnly(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function parseFeedbackTokenExpiresAt(
  expiresIn: string | undefined,
  now = new Date(),
): Date {
  const raw = expiresIn?.trim() ?? "14 days";
  const m = /^(\d+)\s*days?$/i.exec(raw);
  if (!m) {
    throw new BadRequestException(
      "Некорректный expiresIn. Используйте формат 'N days'",
    );
  }
  const days = parseInt(m[1], 10);
  if (!Number.isFinite(days) || days <= 0 || days > 365) {
    throw new BadRequestException("expiresIn должен быть в диапазоне 1..365 days");
  }
  const d = new Date(now.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

type ScoreRow = {
  scoreResult: number | null;
  scoreExplanation: number | null;
  scoreComfort: number | null;
  scoreBooking: number | null;
  scoreRecommendation: number | null;
};

const RATING_LABELS: Record<keyof ScoreRow, string> = {
  scoreResult: "Результат процедуры",
  scoreExplanation: "Объяснения мастера",
  scoreComfort: "Комфорт процедуры",
  scoreBooking: "Удобство записи",
  scoreRecommendation: "Готовность рекомендовать",
};

function calcAverage(rows: ScoreRow[], key: keyof ScoreRow) {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is number => Number.isFinite(value));
  if (!values.length) {
    return { avg: null as number | null, count: 0 };
  }
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return { avg: Math.round(avg * 10) / 10, count: values.length };
}

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async validateToken(tokenRaw: string): Promise<{
    valid: boolean;
    appointment_id: string | null;
  }> {
    const token = tokenRaw?.trim() ?? "";
    if (!token) {
      throw new BadRequestException("Не задан token");
    }

    const row = await this.prisma.feedbackToken.findFirst({
      where: { token },
    });

    const isValid = Boolean(
      row &&
        row.isActive &&
        row.usedAt === null &&
        row.expiresAt.getTime() > Date.now(),
    );

    return {
      valid: isValid,
      appointment_id: isValid ? row!.appointmentId : null,
    };
  }

  async submit(dto: SubmitFeedbackDto): Promise<{
    feedback_id: string;
    discount_percent: number | null;
  }> {
    const feedbackId = await this.prisma.$transaction(async (tx) => {
      const tokenRow = await tx.feedbackToken.findFirst({
        where: {
          token: dto.token,
          isActive: true,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!tokenRow) {
        throw new BadRequestException("Invalid or expired token");
      }

      if (dto.feedback_text.length > 1000) {
        throw new BadRequestException("Feedback text too long");
      }

      const periodBucket = utcDateOnly(new Date());

      const response = await tx.feedbackResponse.create({
        data: {
          userId: tokenRow.userId,
          feedbackText: dto.feedback_text,
          scoreResult: dto.score_result ?? null,
          scoreExplanation: dto.score_explanation ?? null,
          scoreComfort: dto.score_comfort ?? null,
          scoreBooking: dto.score_booking ?? null,
          scoreRecommendation: dto.score_recommendation ?? null,
          periodBucket,
        },
      });

      await tx.feedbackToken.update({
        where: { id: tokenRow.id },
        data: { isActive: false, usedAt: new Date() },
      });

      if (tokenRow.appointmentId) {
        const apt = await tx.appointment.findFirst({
          where: { id: tokenRow.appointmentId },
        });
        if (apt) {
          const normalized = normalizePhone(apt.clientPhone);
          if (isNormalizedPhone(normalized)) {
            const rule = await tx.discountRule.findFirst({
              where: { userId: tokenRow.userId, isActive: true },
              orderBy: { createdAt: "desc" },
            });
            const pct = rule?.discountPercent ?? 5;

            const discPayload = {
              userId: tokenRow.userId,
              clientPhone: normalized,
              appointmentId: apt.id,
              feedbackToken: dto.token,
              discountPercent: pct,
              sourceType: DiscountSourceType.feedback,
              serviceId: apt.serviceId,
              serviceNameSnapshot: apt.serviceName,
            };

            const existing = await tx.clientDiscount.findFirst({
              where: { feedbackToken: dto.token },
            });
            if (existing) {
              await tx.clientDiscount.update({
                where: { id: existing.id },
                data: {
                  clientPhone: discPayload.clientPhone,
                  appointmentId: discPayload.appointmentId,
                  discountPercent: discPayload.discountPercent,
                  sourceType: discPayload.sourceType,
                  serviceId: discPayload.serviceId,
                  serviceNameSnapshot: discPayload.serviceNameSnapshot,
                },
              });
            } else {
              await tx.clientDiscount.create({ data: discPayload });
            }
          }
        }
      }

      return response.id;
    });

    const discountRow = await this.prisma.clientDiscount.findFirst({
      where: { feedbackToken: dto.token },
      select: { discountPercent: true },
    });

    return {
      feedback_id: feedbackId,
      discount_percent: discountRow?.discountPercent ?? null,
    };
  }

  async createTokenForOwner(
    userId: string,
    dto: CreateFeedbackTokenDto,
  ): Promise<string> {
    const expiresAt = parseFeedbackTokenExpiresAt(dto.expiresIn);
    const token = randomUUID().replace(/-/g, "");
    await this.prisma.feedbackToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
    return token;
  }

  async listResponsesForOwner(
    userId: string,
    query: { period?: string; from?: string; to?: string },
  ): Promise<FeedbackResponseApi[]> {
    const parsed = parseFeedbackListQuery({
      period: query.period,
      from: query.from,
      to: query.to,
    });
    if (!parsed.ok) {
      throw new BadRequestException(parsed.message);
    }

    const { from, to } = parsed.range;

    const rows = await this.prisma.feedbackResponse.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(`${from}T00:00:00.000Z`),
          lte: new Date(`${to}T23:59:59.999Z`),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toFeedbackResponseApi);
  }

  async deleteResponseForOwner(
    userId: string,
    id: string,
  ): Promise<void> {
    const result = await this.prisma.feedbackResponse.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        "Отзыв не найден или недоступен для удаления",
      );
    }
  }

  async ratingsTrendForOwner(
    userId: string,
    query: { period?: string; from?: string; to?: string },
  ): Promise<FeedbackRatingTrendApi[]> {
    const parsed = parseFeedbackListQuery({
      period: query.period,
      from: query.from,
      to: query.to,
    });
    if (!parsed.ok) {
      throw new BadRequestException(parsed.message);
    }

    const { from, to } = parsed.range;

    const rows = await this.prisma.feedbackResponse.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(`${from}T00:00:00.000Z`),
          lte: new Date(`${to}T23:59:59.999Z`),
        },
      },
      select: {
        scoreResult: true,
        scoreExplanation: true,
        scoreComfort: true,
        scoreBooking: true,
        scoreRecommendation: true,
      },
    });

    const keys = [
      "scoreResult",
      "scoreExplanation",
      "scoreComfort",
      "scoreBooking",
      "scoreRecommendation",
    ] as const;

    return keys.map((key) => {
      const current = calcAverage(rows, key);
      const snake = key
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
      return {
        key: snake,
        label: RATING_LABELS[key],
        avg: current.avg,
        sampleSize: current.count,
      };
    });
  }
}
