// Типобезопасный парсер ошибки и маппинг сообщений

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

const isSupabaseError = (error: unknown): error is SupabaseErrorLike => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as SupabaseErrorLike).message === "string"
  );
};

export function getErrorMessage(error: unknown, fallback = "Ошибка"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  if (isSupabaseError(error) && error.message) {
    return error.message;
  }
  return fallback;
}

export function mapSupabaseError(
  error: unknown,
  fallback = "Ошибка базы данных",
): string {
  if (isSupabaseError(error)) {
    const code = error.code;
    if (code === "23505") {
      return "Запись уже существует";
    }
    if (code === "23503") {
      return "Связанная запись не найдена";
    }
    if (code === "22P02") {
      return "Некорректный формат данных";
    }
    if (code === "42501") {
      return "Недостаточно прав";
    }
  }
  return getErrorMessage(error, fallback);
}

export function mapLlmError(
  error: unknown,
  fallback = "Ошибка генерации рекомендаций",
): string {
  const message = getErrorMessage(error, fallback);
  const normalized = message.toLowerCase();

  if (normalized.includes("timeout")) {
    return "Модель не ответила вовремя";
  }
  if (normalized.includes("пустой ответ")) {
    return "Модель вернула пустой ответ";
  }
  if (normalized.includes("ollama")) {
    return "Ошибка Ollama";
  }
  if (normalized.includes("yandex")) {
    return "Ошибка Yandex AI";
  }

  return message;
}
