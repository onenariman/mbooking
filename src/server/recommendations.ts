import { addDays, differenceInCalendarDays, format as formatDate, subDays, subMonths } from "date-fns";
import { z } from "zod";

export const MAX_FEEDBACK_ITEMS = 10;
export const MAX_FEEDBACK_CHARS = 1000;
export const MIN_FEEDBACK_COUNT = 3;

export const periodSchema = z.enum(["week", "month", "3m", "6m", "9m", "12m"]);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const recommendationRequestSchema = z
  .object({
    period: periodSchema.optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .refine(
    (data) =>
      (data.period && !data.from && !data.to) ||
      (!data.period && data.from && data.to),
    { message: "Некорректный запрос" },
  );

export type Period = z.infer<typeof periodSchema>;

export type PeriodRange = {
  from: string;
  to: string;
};

export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;

export type FeedbackScores = {
  score_result: number | null;
  score_explanation: number | null;
  score_comfort: number | null;
  score_booking: number | null;
  score_recommendation: number | null;
};

export type FeedbackItem = {
  text: string;
  scores: FeedbackScores;
};

export type LlmResult = {
  modelName: string;
  responseText: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);

const getPeriodRange = (period: Period): PeriodRange => {
  const now = new Date();
  const to = toDateOnlyIso(now);

  if (period === "week") {
    return { from: toDateOnlyIso(subDays(now, 7)), to };
  }
  if (period === "month") {
    return { from: toDateOnlyIso(subMonths(now, 1)), to };
  }
  if (period === "3m") {
    return { from: toDateOnlyIso(subMonths(now, 3)), to };
  }
  if (period === "6m") {
    return { from: toDateOnlyIso(subMonths(now, 6)), to };
  }
  if (period === "9m") {
    return { from: toDateOnlyIso(subMonths(now, 9)), to };
  }

  return { from: toDateOnlyIso(subMonths(now, 12)), to };
};

export const resolveRecommendationRange = (data: RecommendationRequest) => {
  if (data.period) {
    const periodType = data.period;
    const range = getPeriodRange(periodType);
    const horizonLabel =
      periodType === "week"
        ? "7 дней"
        : periodType === "month"
          ? "30 дней"
          : "30 дней (из долгого периода, с фокусом на ближайший месяц)";
    return { periodType, range, horizonLabel };
  }

  const from = data.from ?? "";
  const to = data.to ?? "";
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Некорректный диапазон дат");
  }
  if (fromDate > toDate) {
    throw new Error("Дата начала позже даты окончания");
  }
  const days = Math.max(1, differenceInCalendarDays(toDate, fromDate) + 1);
  const horizonLabel = `${days} дней`;
  return { periodType: "custom" as const, range: { from, to }, horizonLabel };
};

export const buildPrompt = (params: {
  periodType: string;
  from: string;
  to: string;
  horizonLabel: string;
  feedback: FeedbackItem[];
}) => {
  const horizonLabel = params.horizonLabel;

  const formatScore = (value: number | null) =>
    Number.isFinite(value) ? String(value) : "нет";

  const compactFeedback = params.feedback
    .filter((item) => item.text?.trim())
    .slice(0, MAX_FEEDBACK_ITEMS)
    .map((item) => {
      const text = item.text
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, MAX_FEEDBACK_CHARS);
      const scores = [
        `рез=${formatScore(item.scores.score_result)}`,
        `объясн=${formatScore(item.scores.score_explanation)}`,
        `комфорт=${formatScore(item.scores.score_comfort)}`,
        `запись=${formatScore(item.scores.score_booking)}`,
        `рек=${formatScore(item.scores.score_recommendation)}`,
      ].join(", ");
      return `${text} | оценки: ${scores}`;
    });

  const numberedReviews = compactFeedback
    .map((item, idx) => `${idx + 1}. ${item}`)
    .join("\n");

  const scoreStats = (() => {
    const keys = [
      "score_result",
      "score_explanation",
      "score_comfort",
      "score_booking",
      "score_recommendation",
    ] as const;
    const labels: Record<(typeof keys)[number], string> = {
      score_result: "результат процедуры",
      score_explanation: "объяснения мастера",
      score_comfort: "комфорт во время процедуры",
      score_booking: "удобство записи",
      score_recommendation: "готовность рекомендовать",
    };

    return keys
      .map((key) => {
        const values = params.feedback
          .map((item) => item.scores[key])
          .filter((value): value is number => Number.isFinite(value));
        if (!values.length) {
          return `- ${labels[key]}: нет данных`;
        }
        const avg =
          values.reduce((sum, value) => sum + value, 0) / values.length;
        const rounded = Math.round(avg * 10) / 10;
        return `- ${labels[key]}: ${rounded} (n=${values.length})`;
      })
      .join("\n");
  })();

  return [
    "Ты — аналитик клиентского опыта студии электроэпиляции и косметологии.",
    "Сделай практичные рекомендации по отзывам и оценкам 1–5. Используй только данные ниже.",
    "Если данных не хватает — пиши «Недостаточно данных». Верни СТРОГО JSON без markdown.",
    "",
    "Формат ответа (строго):",
    "{",
    '  "summary": "тональность, ключевые темы и лояльность",',
    '  "strengths": ["string","string","string"],',
    '  "issues": [{"issue":"string","root_cause":"string","retention_impact":"high|medium|low"}],',
    '  "actions_plan": [{"action":"string","owner":"admin|master|owner","impact":"high|medium|low","effort":"high|medium|low","kpi":"string","deadline":"YYYY-MM-DD"}],',
    '  "quick_win": "string",',
    '  "scripts": {"reminder_message":"string","late_message":"string"},',
    '  "priority": "high|medium|low"',
    "}",
    "",
    "Правила:",
    "- язык: русский, деловой",
    "- strengths: 3 пункта, только повторяющиеся позитивы",
    "- issues: 3 проблемы, root_cause не симптом",
    `- actions_plan: 3–5 действий на горизонт ${horizonLabel}`,
    "- учитывай оценки; низкие (<=3) считаются сигналом проблемы",
    "",
    "Контекст периода:",
    `period_type: ${params.periodType}`,
    `period_from: ${params.from}`,
    `period_to: ${params.to}`,
    `planning_horizon: ${horizonLabel}`,
    `reviews_count: ${params.feedback.length}`,
    "",
    "Сводные оценки (среднее; n):",
    scoreStats || "нет данных",
    "",
    "Отзывы:",
    numberedReviews,
  ].join("\n");
};

const levelRu = (value?: string) => {
  if (value === "high") return "высокий";
  if (value === "medium") return "средний";
  if (value === "low") return "низкий";
  return value || "Недостаточно данных";
};

const ownerRu = (value?: string) => {
  if (value === "admin") return "администратор";
  if (value === "master") return "мастер";
  if (value === "owner") return "владелец";
  return value || "Недостаточно данных";
};

const formatDeadlineRu = (value: string): string => {
  const normalized = value.trim();
  const relativeMatch = normalized.match(/^D\+(\d{1,2})$/i);
  if (relativeMatch) {
    const days = Number(relativeMatch[1]);
    if (Number.isFinite(days)) {
      const date = addDays(new Date(), days);
      return `через ${days} дн. (${formatDate(date, "dd.MM.yyyy")})`;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const date = new Date(`${normalized}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return formatDate(date, "dd.MM.yyyy");
    }
  }

  return normalized || "Недостаточно данных";
};

export const normalizeSummary = (rawResponse: string): string => {
  const trimmed = rawResponse.trim();
  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      summary?: string;
      strengths?: string[];
      issues?: Array<{
        issue?: string;
        root_cause?: string;
        retention_impact?: "high" | "medium" | "low" | string;
      }>;
      actions_plan?: Array<{
        action?: string;
        owner?: "admin" | "master" | "owner" | string;
        impact?: "high" | "medium" | "low" | string;
        effort?: "high" | "medium" | "low" | string;
        kpi?: string;
        deadline?: string;
      }>;
      actions_next_week?: Array<{
        action?: string;
        owner?: "admin" | "master" | "owner" | string;
        impact?: "high" | "medium" | "low" | string;
        effort?: "high" | "medium" | "low" | string;
        kpi?: string;
        deadline_day?: number | string;
      }>;
      quick_win?: string;
      scripts?: { reminder_message?: string; late_message?: string };
      priority?: string;
    };

    const summary = parsed.summary?.trim() || "Недостаточно данных";
    const strengths = (parsed.strengths ?? []).filter(Boolean).slice(0, 3);
    const issues = (parsed.issues ?? []).slice(0, 3);
    const actionsSource = (parsed.actions_plan?.length
      ? parsed.actions_plan
      : parsed.actions_next_week) ?? [];
    const actions = actionsSource
      .slice(0, 5)
      .map((item, idx) => {
        const action = item.action || "Недостаточно данных";
        const kpi = item.kpi || "Недостаточно данных";
        const owner = ownerRu(item.owner);
        const impact = levelRu(item.impact);
        const effort = levelRu(item.effort);
        const deadline =
          "deadline" in item && item.deadline !== undefined
            ? item.deadline
            : "deadline_day" in item
              ? (item.deadline_day ?? "Недостаточно данных")
              : "Недостаточно данных";
        return `${idx + 1}. ${action}\n   Ответственный: ${owner}\n   Влияние: ${impact}\n   Сложность: ${effort}\n   KPI: ${kpi}\n   Срок: ${formatDeadlineRu(String(deadline))}`;
      });
    const issuesText = issues.map((item, idx) => {
      const issue = item.issue || "Недостаточно данных";
      const rootCause = item.root_cause || "Недостаточно данных";
      const retentionImpact = levelRu(item.retention_impact);
      return `${idx + 1}. ${issue}\n   Вероятная причина: ${rootCause}\n   Влияние на возврат клиента: ${retentionImpact}`;
    });

    return [
      `Сводка\n${summary}`,
      "",
      "Сильные стороны",
      strengths.length
        ? strengths.map((item, idx) => `${idx + 1}. ${item}`).join("\n")
        : "Недостаточно данных",
      "",
      "Зоны роста",
      issuesText.length ? issuesText.join("\n") : "Недостаточно данных",
      "",
      "План действий",
      actions.length ? actions.join("\n") : "Недостаточно данных",
      "",
      `Быстрая победа\n${parsed.quick_win || "Недостаточно данных"}`,
      "",
      `Скрипт напоминания\n${parsed.scripts?.reminder_message || "Недостаточно данных"}`,
      "",
      `Скрипт при задержке\n${parsed.scripts?.late_message || "Недостаточно данных"}`,
      "",
      `Приоритет: ${levelRu(parsed.priority)}`,
    ].join("\n");
  } catch {
    return cleaned;
  }
};

type OllamaGenerateResponse = {
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
};

type YandexCompletionResponse = {
  result?: {
    alternatives?: Array<{
      message?: {
        text?: string;
      };
    }>;
    usage?: {
      inputTextTokens?: string | number;
      completionTokens?: string | number;
    };
  };
};

const parseTokenCount = (value: string | number | undefined): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return null;
};

const callOllama = async (prompt: string): Promise<LlmResult> => {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 240_000);

  let ollamaResponse: Response;
  try {
    ollamaResponse = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          num_predict: 320,
          temperature: 0.2,
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Ollama timeout: модель не ответила за 240 секунд");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!ollamaResponse.ok) {
    const text = await ollamaResponse.text();
    throw new Error(`Ollama error: ${text || ollamaResponse.statusText}`);
  }

  const llmData = (await ollamaResponse.json()) as OllamaGenerateResponse;
  const responseText = llmData.response?.trim() || "";
  if (!responseText) {
    throw new Error("Пустой ответ от модели");
  }

  return {
    modelName: model,
    responseText,
    inputTokens: llmData.prompt_eval_count ?? null,
    outputTokens: llmData.eval_count ?? null,
  };
};

const callYandex = async (prompt: string): Promise<LlmResult> => {
  const folderId = process.env.YANDEX_FOLDER_ID;
  const modelUri =
    process.env.YANDEX_MODEL_URI || `gpt://${folderId}/yandexgpt/latest`;
  const iamToken = process.env.YANDEX_IAM_TOKEN;
  const apiKey = process.env.YANDEX_API_KEY;

  if (!folderId) {
    throw new Error("YANDEX_FOLDER_ID не задан");
  }
  if (!iamToken && !apiKey) {
    throw new Error("Нужен YANDEX_IAM_TOKEN или YANDEX_API_KEY");
  }

  const authHeader = iamToken ? `Bearer ${iamToken}` : `Api-Key ${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  let yandexResponse: Response;
  try {
    yandexResponse = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "x-folder-id": folderId,
        },
        body: JSON.stringify({
          modelUri,
          completionOptions: {
            stream: false,
            temperature: 0.2,
            maxTokens: "800",
          },
          messages: [
            {
              role: "user",
              text: prompt,
            },
          ],
        }),
        cache: "no-store",
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Yandex AI timeout: модель не ответила за 120 секунд");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!yandexResponse.ok) {
    const text = await yandexResponse.text();
    throw new Error(`Yandex AI error: ${text || yandexResponse.statusText}`);
  }

  const data = (await yandexResponse.json()) as YandexCompletionResponse;
  const responseText =
    data.result?.alternatives?.[0]?.message?.text?.trim() || "";
  if (!responseText) {
    throw new Error("Пустой ответ от Yandex AI");
  }

  return {
    modelName: modelUri,
    responseText,
    inputTokens: parseTokenCount(data.result?.usage?.inputTextTokens),
    outputTokens: parseTokenCount(data.result?.usage?.completionTokens),
  };
};

export const runLlm = async (prompt: string): Promise<LlmResult> => {
  const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();
  if (provider === "yandex") {
    return callYandex(prompt);
  }
  return callOllama(prompt);
};
