"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LOGIN_ERRORS: Record<string, string> = {
  "nest-unconfigured":
    "API не настроено: задайте NEST_API_INTERNAL_URL и NEST_JWT_ACCESS_SECRET в .env (секрет = JWT_ACCESS_SECRET из backend/.env).",
  "oauth_cancelled": "Вход через Яндекс отменён или не завершён.",
  "oauth_failed":
    "Не удалось завершить вход через Яндекс. Попробуйте ещё раз или проверьте настройки OAuth.",
  "oauth_misconfigured":
    "OAuth не настроен: Next — YANDEX_OAUTH_CLIENT_ID, YANDEX_OAUTH_REDIRECT_URI, NEST_OAUTH_CALLBACK_SECRET; Nest — YANDEX_OAUTH_CLIENT_ID, YANDEX_OAUTH_CLIENT_SECRET, YANDEX_OAUTH_REDIRECT_URI, NEST_OAUTH_CALLBACK_SECRET.",
};

function decodeMessage(raw: string | null): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function LoginAuthMessages() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const detail = decodeMessage(searchParams.get("message"));

  if (!error) return null;
  const text =
    LOGIN_ERRORS[error] ?? detail ?? "Произошла ошибка. Попробуйте ещё раз.";

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Ошибка</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
