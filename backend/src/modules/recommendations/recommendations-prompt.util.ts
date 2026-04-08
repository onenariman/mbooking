import { addDays, format as formatDate } from "date-fns";

export const MAX_FEEDBACK_ITEMS = 10;
export const MAX_FEEDBACK_CHARS = 1000;
export const MIN_FEEDBACK_COUNT = 3;

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

export function buildPrompt(params: {
  periodType: string;
  from: string;
  to: string;
  horizonLabel: string;
  feedback: FeedbackItem[];
}): string {
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

  const buildContextBlock = () =>
    [
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
    buildContextBlock(),
  ].join("\n");
}

export function buildPromptFromTemplate(
  params: {
    periodType: string;
    from: string;
    to: string;
    horizonLabel: string;
    feedback: FeedbackItem[];
  },
  template: string,
): string {
  const basePrompt = buildPrompt(params);
  const trimmed = template.trim();
  if (!trimmed) {
    return basePrompt;
  }

  const contextBlock = (() => {
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
  })();

  if (trimmed.includes("{{context}}")) {
    return trimmed.replace("{{context}}", contextBlock);
  }

  return `${trimmed}\n\n${contextBlock}`;
}

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

export function normalizeSummary(rawResponse: string): string {
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
}

export function getHorizonLabelForRun(
  periodType: string,
  from: string,
  to: string,
): string {
  if (periodType === "week") return "7 дней";
  if (periodType === "month") return "30 дней";
  if (periodType !== "custom") {
    return "30 дней (из долгого периода, с фокусом на ближайший месяц)";
  }

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return "период";
  }
  const days = Math.max(
    1,
    Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1,
  );
  return `${days} дней`;
}
