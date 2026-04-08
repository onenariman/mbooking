import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RecommendationJobStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  RecommendationsLlmService,
  mapLlmError,
} from "./recommendations-llm.service";
import {
  buildPrompt,
  buildPromptFromTemplate,
  getHorizonLabelForRun,
  MIN_FEEDBACK_COUNT,
  normalizeSummary,
  type FeedbackItem,
} from "./recommendations-prompt.util";
import {
  getPeriodRange,
  resolveRecommendationRange,
  utcDateOnly,
} from "./recommendations-range.util";
import {
  toAiRecommendationResponse,
  toJobResponse,
  toPromptResponse,
} from "./recommendations.types";
import type { CreateRecommendationJobDto } from "./dto/create-recommendation-job.dto";
import type { CreateRecommendationPromptDto } from "./dto/create-recommendation-prompt.dto";
import type { ListRecommendationsQueryDto } from "./dto/list-recommendations-query.dto";
import type { UpdateRecommendationPromptDto } from "./dto/update-recommendation-prompt.dto";
import type { PresetPeriod } from "./recommendations-range.util";

function assertRangeParams(
  dto: { period?: string; from?: string; to?: string },
  message: string,
): void {
  const hasPeriod = Boolean(dto.period);
  const hasFromTo = Boolean(dto.from && dto.to);
  if ((hasPeriod && (dto.from || dto.to)) || (!hasPeriod && !hasFromTo)) {
    throw new BadRequestException(message);
  }
}

function isMeaningfulFeedback(item: FeedbackItem): boolean {
  const hasText = item.text.trim().length > 0;
  const hasScore = Object.values(item.scores).some(
    (value) => typeof value === "number",
  );
  return hasText || hasScore;
}

const toStartIso = (date: string) => `${date}T00:00:00.000Z`;
const toEndIso = (date: string) => `${date}T23:59:59.999Z`;

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: RecommendationsLlmService,
  ) {}

  async listAiRecommendations(
    userId: string,
    query: ListRecommendationsQueryDto,
  ) {
    assertRangeParams(query, "Некорректные параметры");

    const where: Prisma.AiRecommendationWhereInput = { userId };

    if (query.period) {
      const range = getPeriodRange(query.period);
      where.periodType = query.period;
      where.periodFrom = { gte: utcDateOnly(range.from) };
      where.periodTo = { lte: utcDateOnly(range.to) };
    } else if (query.from && query.to) {
      where.periodFrom = utcDateOnly(query.from);
      where.periodTo = utcDateOnly(query.to);
    }

    const rows = await this.prisma.aiRecommendation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toAiRecommendationResponse);
  }

  async deleteAiRecommendation(userId: string, id: string) {
    const result = await this.prisma.aiRecommendation.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        "Рекомендация не найдена или недоступна для удаления",
      );
    }
    return true;
  }

  async createJob(userId: string, dto: CreateRecommendationJobDto) {
    assertRangeParams(dto, "Некорректный запрос");

    let resolved: ReturnType<typeof resolveRecommendationRange>;
    try {
      resolved = resolveRecommendationRange({
        period: dto.period as PresetPeriod | undefined,
        from: dto.from,
        to: dto.to,
      });
    } catch {
      throw new BadRequestException("Некорректный диапазон");
    }

    const { periodType, range } = resolved;
    const promptId = dto.prompt_id ?? null;

    if (promptId) {
      const prompt = await this.prisma.recommendationPrompt.findFirst({
        where: { id: promptId, userId },
        select: { id: true },
      });
      if (!prompt) {
        throw new NotFoundException("Промпт не найден");
      }
    }

    const existingWhere: Prisma.RecommendationJobWhereInput = {
      userId,
      periodFrom: utcDateOnly(range.from),
      periodTo: utcDateOnly(range.to),
      status: {
        in: [
          RecommendationJobStatus.queued,
          RecommendationJobStatus.running,
        ],
      },
      promptId: promptId === null ? null : promptId,
    };

    if (dto.period !== undefined) {
      existingWhere.periodType = periodType;
    }

    const existing = await this.prisma.recommendationJob.findFirst({
      where: existingWhere,
      orderBy: { requestedAt: "desc" },
    });

    if (existing) {
      return toJobResponse(existing);
    }

    const job = await this.prisma.recommendationJob.create({
      data: {
        userId,
        periodType,
        periodFrom: utcDateOnly(range.from),
        periodTo: utcDateOnly(range.to),
        promptId,
        status: RecommendationJobStatus.queued,
      },
    });

    return toJobResponse(job);
  }

  async getJob(userId: string, jobId: string) {
    const job = await this.prisma.recommendationJob.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) {
      throw new NotFoundException("Задача не найдена");
    }
    return toJobResponse(job);
  }

  async runJob(userId: string, jobId: string) {
    const startedAt = new Date();

    const claim = await this.prisma.recommendationJob.updateMany({
      where: {
        id: jobId,
        userId,
        status: RecommendationJobStatus.queued,
      },
      data: {
        status: RecommendationJobStatus.running,
        startedAt,
      },
    });

    if (claim.count === 0) {
      const existing = await this.prisma.recommendationJob.findFirst({
        where: { id: jobId, userId },
      });
      if (!existing) {
        throw new NotFoundException("Задача не найдена");
      }
      return toJobResponse(existing);
    }

    const job = await this.prisma.recommendationJob.findUniqueOrThrow({
      where: { id: jobId },
    });

    const jobStart = Date.now();
    const periodFromStr = job.periodFrom.toISOString().slice(0, 10);
    const periodToStr = job.periodTo.toISOString().slice(0, 10);
    const promptId = job.promptId;

    const updateJob = async (patch: Prisma.RecommendationJobUpdateInput) => {
      const updated = await this.prisma.recommendationJob.update({
        where: { id: jobId },
        data: patch,
      });
      return toJobResponse(updated);
    };

    let promptTemplate: string | null = null;
    let promptNameSnapshot = "Системный";
    if (promptId) {
      const prompts = await this.prisma.recommendationPrompt.findMany({
        where: { id: promptId, userId },
        take: 1,
        select: { name: true, content: true },
      });

      if (prompts.length === 0) {
        return updateJob({
          status: RecommendationJobStatus.failed,
          finishedAt: new Date(),
          errorCode: "PROMPT_NOT_FOUND",
          errorMessage: "Промпт не найден",
          durationMs: Date.now() - jobStart,
        });
      }

      promptNameSnapshot = prompts[0]?.name ?? "Пользовательский промпт";
      promptTemplate = prompts[0]?.content ?? null;
    }

    const feedbackRows = await this.prisma.feedbackResponse.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(toStartIso(periodFromStr)),
          lte: new Date(toEndIso(periodToStr)),
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        feedbackText: true,
        scoreResult: true,
        scoreExplanation: true,
        scoreComfort: true,
        scoreBooking: true,
        scoreRecommendation: true,
      },
    });

    const feedbackItems: FeedbackItem[] = feedbackRows.map((row) => ({
      text: row.feedbackText ?? "",
      scores: {
        score_result: row.scoreResult,
        score_explanation: row.scoreExplanation,
        score_comfort: row.scoreComfort,
        score_booking: row.scoreBooking,
        score_recommendation: row.scoreRecommendation,
      },
    }));

    const meaningfulFeedback = feedbackItems.filter(isMeaningfulFeedback);
    if (meaningfulFeedback.length < MIN_FEEDBACK_COUNT) {
      return updateJob({
        status: RecommendationJobStatus.failed,
        finishedAt: new Date(),
        errorCode: "INSUFFICIENT_FEEDBACK",
        errorMessage: "Недостаточно отзывов для рекомендаций",
        sourceCount: meaningfulFeedback.length,
        durationMs: Date.now() - jobStart,
      });
    }

    const horizonLabel = getHorizonLabelForRun(
      job.periodType,
      periodFromStr,
      periodToStr,
    );
    const promptPayload = {
      periodType: job.periodType,
      from: periodFromStr,
      to: periodToStr,
      horizonLabel,
      feedback: meaningfulFeedback,
    };
    const prompt = promptTemplate
      ? buildPromptFromTemplate(promptPayload, promptTemplate)
      : buildPrompt(promptPayload);

    const promptChars = prompt.length;
    let llmResult;
    try {
      llmResult = await this.llm.runLlm(prompt);
    } catch (error) {
      return updateJob({
        status: RecommendationJobStatus.failed,
        finishedAt: new Date(),
        errorCode: "LLM_ERROR",
        errorMessage: mapLlmError(error),
        sourceCount: meaningfulFeedback.length,
        promptChars,
        durationMs: Date.now() - jobStart,
      });
    }

    const summary = normalizeSummary(llmResult.responseText);

    let recommendation;
    try {
      recommendation = await this.prisma.aiRecommendation.create({
        data: {
          userId,
          periodType: job.periodType,
          periodFrom: utcDateOnly(periodFromStr),
          periodTo: utcDateOnly(periodToStr),
          promptId,
          promptIdSnapshot: promptId,
          promptNameSnapshot,
          promptSnapshot: promptTemplate,
          sourceCount: meaningfulFeedback.length,
          summary,
          modelName: llmResult.modelName,
          inputTokens: llmResult.inputTokens,
          outputTokens: llmResult.outputTokens,
        },
      });
    } catch {
      return updateJob({
        status: RecommendationJobStatus.failed,
        finishedAt: new Date(),
        errorCode: "DB_ERROR",
        errorMessage: "Не удалось сохранить рекомендацию",
        sourceCount: meaningfulFeedback.length,
        promptChars,
        durationMs: Date.now() - jobStart,
      });
    }

    return updateJob({
      status: RecommendationJobStatus.succeeded,
      finishedAt: new Date(),
      resultId: recommendation.id,
      modelName: llmResult.modelName,
      inputTokens: llmResult.inputTokens,
      outputTokens: llmResult.outputTokens,
      sourceCount: meaningfulFeedback.length,
      promptChars,
      durationMs: Date.now() - jobStart,
    });
  }

  async listPrompts(userId: string) {
    const rows = await this.prisma.recommendationPrompt.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toPromptResponse);
  }

  async createPrompt(userId: string, dto: CreateRecommendationPromptDto) {
    if (dto.is_default) {
      await this.prisma.recommendationPrompt.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const row = await this.prisma.recommendationPrompt.create({
      data: {
        userId,
        name: dto.name.trim(),
        content: dto.content.trim(),
        isDefault: dto.is_default ?? false,
      },
    });
    return toPromptResponse(row);
  }

  async updatePrompt(
    userId: string,
    id: string,
    dto: UpdateRecommendationPromptDto,
  ) {
    if (
      dto.name === undefined &&
      dto.content === undefined &&
      dto.is_default === undefined
    ) {
      throw new BadRequestException("Нет полей для обновления");
    }

    if (dto.is_default) {
      await this.prisma.recommendationPrompt.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    try {
      const row = await this.prisma.recommendationPrompt.update({
        where: { id, userId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
          ...(dto.is_default !== undefined ? { isDefault: dto.is_default } : {}),
        },
      });
      return toPromptResponse(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundException(
          "Промпт не найден или недоступен для обновления",
        );
      }
      throw e;
    }
  }

  async deletePrompt(userId: string, id: string) {
    const result = await this.prisma.recommendationPrompt.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        "Промпт не найден или недоступен для удаления",
      );
    }
    return true;
  }
}
