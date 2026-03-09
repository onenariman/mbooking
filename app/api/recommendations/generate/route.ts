import { subDays, subMonths } from "date-fns";
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
  const numberedReviews = params.feedback
    .map((item, idx) => `${idx + 1}. ${item}`)
    .join("\n");

  return [
    "Ты — старший аналитик клиентского опыта студии электроэпиляции и косметологии.",
    "Твоя задача: по анонимным отзывам за период выдать практичные рекомендации для владельца бизнеса.",
    "",
    "Твоя экспертиза охватывает специфику ниши:",
    "- Услуга предполагает длительный курс (от нескольких месяцев до 2 лет), поэтому retention и возврат клиента критичны.",
    "- Типичные триггеры оттока: ощущение отсутствия прогресса, боль без предупреждения, ощущение нестерильности, непрозрачность цен, неудобный график, слабая коммуникация.",
    "- Ключевые метрики здоровья студии: удовлетворенность сеансом, готовность рекомендовать, возврат на следующий визит.",
    "- Отделяй симптом от причины: «клиент упоминает боль» — симптом; «мастер не объяснил ощущения заранее» — причина.",
    "",
    "Верни СТРОГО JSON (без markdown, без пояснений вне JSON).",
    "Верни корректный JSON-объект. Если поле не заполнено, используй значение «Недостаточно данных».",
    "",
    "Схема ответа:",
    "{",
    '  "summary": "string — общая тональность, доминирующие темы, уровень лояльности. Если данных мало или сигнал слабый — явно укажи это.",',
    '  "strengths": ["string", "string", "string"],',
    '  "issues": [',
    "    {",
    '      "issue": "string — суть проблемы",',
    '      "root_cause": "string — вероятная причина, не симптом",',
    '      "retention_impact": "high|medium|low"',
    "    }",
    "  ],",
    '  "actions_next_week": [',
    "    {",
    '      "action": "string — конкретное действие, без воды",',
    '      "owner": "admin|master|owner",',
    '      "impact": "high|medium|low",',
    '      "effort": "high|medium|low",',
    '      "kpi": "string — измеримый результат за 7 дней",',
    '      "deadline_day": "1|2|3|4|5|6|7"',
    "    }",
    "  ],",
    '  "quick_win": "string — одно действие, реализуемое за 24 часа, заметное для клиента",',
    '  "scripts": {',
    '    "reminder_message": "string — короткий вежливый текст напоминания о записи",',
    '    "late_message": "string — текст при задержке приема: извинение + новый ориентир по времени"',
    "  },",
    '  "priority": "high|medium|low"',
    "}",
    "",
    "Требования к анализу:",
    "- Язык: русский. Деловой, конкретный, без воды и эмодзи.",
    "- Опирайся ТОЛЬКО на переданные отзывы. Не добавляй факты, которых нет во входных данных.",
    "- Если данных мало, укажи «Недостаточно данных» в соответствующем поле вместо домыслов.",
    "- strengths: 3 пункта — только то, что клиенты отметили явно и повторно.",
    "- issues: 3 пункта с root_cause и оценкой влияния на возврат клиента.",
    "- actions_next_week: 3-5 действий, выполнимых за 7 дней, каждое с измеримым KPI и deadline_day от 1 до 7.",
    "- quick_win: малозатратное, но высокозаметное для клиента улучшение.",
    "- scripts.reminder_message: до 3 предложений, теплый тон, без давления.",
    "- scripts.late_message: до 3 предложений, с извинением, конкретным новым временем ожидания, без оправданий.",
    "- priority:",
    "  - high — повторяющиеся жалобы на задержки, сервис, чистоту или коммуникацию;",
    "  - medium — смешанный сигнал, единичные негативные темы;",
    "  - low — преобладает позитив, единичные замечания.",
    "- Не используй медицинские обещания, категоричные формулировки и обобщения без опоры на отзывы.",
    "",
    "Контекст периода:",
    `period_type: ${params.period}`,
    `period_from: ${params.from}`,
    `period_to: ${params.to}`,
    `reviews_count: ${params.feedback.length}`,
    "",
    "Отзывы:",
    numberedReviews,
  ].join("\n");
};

const normalizeSummary = (rawResponse: string): string => {
  const trimmed = rawResponse.trim();

  try {
    const parsed = JSON.parse(trimmed) as {
      summary?: string;
      strengths?: string[];
      issues?: Array<{
        issue?: string;
        root_cause?: string;
        retention_impact?: "high" | "medium" | "low" | string;
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
    const actions = (parsed.actions_next_week ?? [])
      .slice(0, 5)
      .map((item, idx) => {
        const action = item.action || "Недостаточно данных";
        const kpi = item.kpi || "Недостаточно данных";
        const owner = item.owner || "Недостаточно данных";
        const impact = item.impact || "medium";
        const effort = item.effort || "medium";
        const deadlineDay = item.deadline_day ?? "Недостаточно данных";
        return `${idx + 1}. ${action} (owner: ${owner}, impact: ${impact}, effort: ${effort}, KPI: ${kpi}, day: ${deadlineDay})`;
      });
    const issuesText = issues.map((item, idx) => {
      const issue = item.issue || "Недостаточно данных";
      const rootCause = item.root_cause || "Недостаточно данных";
      const retentionImpact = item.retention_impact || "medium";
      return `${idx + 1}. ${issue} (причина: ${rootCause}; влияние на retention: ${retentionImpact})`;
    });

    return [
      `Сводка: ${summary}`,
      "",
      `Сильные стороны: ${strengths.length ? strengths.join("; ") : "Недостаточно данных"}`,
      `Зоны роста: ${issuesText.length ? issuesText.join(" ") : "Недостаточно данных"}`,
      "",
      `Действия на неделю: ${actions.length ? actions.join(" ") : "Недостаточно данных"}`,
      `Быстрая победа: ${parsed.quick_win || "Недостаточно данных"}`,
      `Скрипт напоминания: ${parsed.scripts?.reminder_message || "Недостаточно данных"}`,
      `Скрипт при задержке: ${parsed.scripts?.late_message || "Недостаточно данных"}`,
      `Приоритет: ${parsed.priority || "medium"}`,
    ].join("\n");
  } catch {
    return trimmed;
  }
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
      return NextResponse.json({ message: feedbackError.message }, { status: 500 });
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

    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const model = process.env.OLLAMA_MODEL || "qwen2.5:7b";

    const prompt = buildPrompt({
      period,
      from: range.from,
      to: range.to,
      feedback,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);
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
            num_predict: 700,
            temperature: 0.2,
          },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { message: "Ollama timeout: модель не ответила за 90 секунд" },
          { status: 504 },
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!ollamaResponse.ok) {
      const text = await ollamaResponse.text();
      return NextResponse.json(
        { message: `Ollama error: ${text || ollamaResponse.statusText}` },
        { status: 502 },
      );
    }

    const llmData = (await ollamaResponse.json()) as OllamaGenerateResponse;
    const responseText = llmData.response?.trim() || "";

    if (!responseText) {
      return NextResponse.json(
        { message: "Пустой ответ от модели" },
        { status: 502 },
      );
    }

    const summary = normalizeSummary(responseText);

    const { data: inserted, error: insertError } = await supabase
      .from("ai_recommendations")
      .insert({
        user_id: user.id,
        period_type: period,
        period_from: range.from,
        period_to: range.to,
        source_count: feedback.length,
        summary,
        model_name: model,
        input_tokens: llmData.prompt_eval_count ?? null,
        output_tokens: llmData.eval_count ?? null,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ message: insertError.message }, { status: 500 });
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

