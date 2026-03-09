import { addDays, format as formatDate, subDays, subMonths } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";

const requestSchema = z.object({
  period: z.enum(["week", "month", "3m", "6m", "9m", "12m"]),
});

type Period = z.infer<typeof requestSchema>["period"];

type PeriodRange = {
  from: string;
  to: string;
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

type LlmResult = {
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

const buildPrompt = (params: {
  period: Period;
  from: string;
  to: string;
  feedback: string[];
}) => {
  const horizonLabel =
    params.period === "week"
      ? "7 дней"
      : params.period === "month"
        ? "30 дней"
        : "30 дней (из долгого периода, с фокусом на ближайший месяц)";

  const compactFeedback = params.feedback
    .slice(0, 10)
    .map((item) => item.trim().replace(/\s+/g, " ").slice(0, 350));

  const numberedReviews = compactFeedback
    .map((item, idx) => `${idx + 1}. ${item}`)
    .join("\n");

  return [
    "Ты — старший аналитик клиентского опыта студии электроэпиляции и косметологии.",
    "По анонимным отзывам за период подготовь практичные рекомендации для владельца студии.",
    "",
    "Контекст ниши:",
    "- процедуры проходят курсом от нескольких месяцев до 2 лет, поэтому критичен возврат клиента",
    "- типичные причины оттока: ощущение отсутствия прогресса, боль без предупреждения, сомнения в стерильности, непрозрачность цен, неудобный график, слабая коммуникация",
    "- важные показатели: удовлетворенность сеансом, готовность рекомендовать, возврат на следующий визит",
    "- отделяй симптом от причины (например: «больно» — симптом, «мастер не объяснил ощущения» — причина)",
    "",
    "Верни СТРОГО JSON без markdown и пояснений вне JSON.",
    "Если информации недостаточно — используй значение «Недостаточно данных».",
    "",
    "Формат ответа:",
    "{",
    '  "summary": "общая тональность, ключевые темы и уровень лояльности. Если сигнал слабый — укажи это",',
    '  "strengths": ["string","string","string"],',
    '  "issues": [',
    "    {",
    '      "issue": "суть проблемы",',
    '      "root_cause": "вероятная причина (не симптом)",',
    '      "retention_impact": "high|medium|low"',
    "    }",
    "  ],",
    '  "actions_plan": [',
    "    {",
    '      "action": "конкретное действие",',
    '      "owner": "admin|master|owner",',
    '      "impact": "high|medium|low",',
    '      "effort": "high|medium|low",',
    '      "kpi": "измеримый результат на горизонт плана",',
    '      "deadline": "YYYY-MM-DD (например 2026-03-20)"',
    "    }",
    "  ],",
    '  "quick_win": "заметное для клиента улучшение, реализуемое за 24 часа",',
    '  "scripts": {',
    '    "reminder_message": "короткое вежливое напоминание о записи (до 3 предложений)",',
    '    "late_message": "сообщение при задержке: извинение и новый ориентир по времени (до 3 предложений)"',
    "  },",
    '  "priority": "high|medium|low"',
    "}",
    "",
    "Правила анализа:",
    "- язык: русский, деловой стиль, без воды и эмодзи",
    "- опирайся только на переданные отзывы",
    "- не добавляй факты, которых нет во входных данных",
    "- strengths: 3 пункта, только явно отмеченные клиентами и повторяющиеся",
    "- issues: 3 проблемы с root_cause и влиянием на возврат клиента",
    `- actions_plan: 3–5 конкретных действий на горизонт ${horizonLabel}`,
    "- каждый action должен иметь KPI и реалистичный deadline",
    "",
    "Определение приоритета:",
    "- high — повторяющиеся жалобы на задержки, сервис, чистоту или коммуникацию",
    "- medium — смешанный сигнал, отдельные негативные темы",
    "- low — в основном позитивные отзывы, единичные замечания",
    "",
    "Контекст периода:",
    `period_type: ${params.period}`,
    `period_from: ${params.from}`,
    `period_to: ${params.to}`,
    `planning_horizon: ${horizonLabel}`,
    `reviews_count: ${params.feedback.length}`,
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

const normalizeSummary = (rawResponse: string): string => {
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

const runLlm = async (prompt: string): Promise<LlmResult> => {
  const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();
  if (provider === "yandex") {
    return callYandex(prompt);
  }
  return callOllama(prompt);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Некорректный период" },
        { status: 400 },
      );
    }

    const period = parsed.data.period;
    const range = getPeriodRange(period);
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback_responses")
      .select("feedback_text")
      .eq("user_id", user.id)
      .gte("created_at", `${range.from}T00:00:00.000Z`)
      .lte("created_at", `${range.to}T23:59:59.999Z`)
      .order("created_at", { ascending: false });

    if (feedbackError) {
      return NextResponse.json(
        { message: feedbackError.message },
        { status: 500 },
      );
    }

    const feedback = (feedbackData ?? []).map((item) => item.feedback_text);

    if (feedback.length < 3) {
      return NextResponse.json(
        {
          code: "INSUFFICIENT_FEEDBACK",
          message: "Недостаточно отзывов для рекомендаций",
        },
        { status: 400 },
      );
    }

    const prompt = buildPrompt({
      period,
      from: range.from,
      to: range.to,
      feedback,
    });
    const llm = await runLlm(prompt);
    const summary = normalizeSummary(llm.responseText);

    const { data: inserted, error: insertError } = await supabase
      .from("ai_recommendations")
      .insert({
        user_id: user.id,
        period_type: period,
        period_from: range.from,
        period_to: range.to,
        source_count: feedback.length,
        summary,
        model_name: llm.modelName,
        input_tokens: llm.inputTokens,
        output_tokens: llm.outputTokens,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: inserted });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Не удалось сгенерировать рекомендации",
      },
      { status: 500 },
    );
  }
}

