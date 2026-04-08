"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LOGIN_ERRORS: Record<string, string> = {
  "auth-failed": "Неверный email или пароль. Проверьте данные и попробуйте снова.",
  "registration-disabled":
    "Открытая регистрация отключена. Обратитесь к администратору или войдите через предложенный способ.",
  "nest-unconfigured":
    "В production задайте NEST_API_INTERNAL_URL и NEST_JWT_ACCESS_SECRET в .env (секрет = JWT_ACCESS_SECRET из backend/.env). В dev URL Nest по умолчанию http://localhost:4000.",
};

const REGISTER_ERRORS: Record<string, string> = {
  "password-mismatch": "Пароли не совпадают.",
  "password-short": "Пароль должен быть не короче 8 символов.",
  "email-taken": "Этот email уже зарегистрирован. Войдите или восстановите доступ.",
  "signup-failed":
    "Не удалось зарегистрироваться. Попробуйте позже или проверьте логи Nest.",
  "nest-unconfigured": LOGIN_ERRORS["nest-unconfigured"],
  "registration-disabled": LOGIN_ERRORS["registration-disabled"],
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

export function RegisterAuthMessages() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const detail = decodeMessage(searchParams.get("message"));

  if (!error) return null;
  const base =
    REGISTER_ERRORS[error] ?? REGISTER_ERRORS["signup-failed"];
  const text = error === "signup-failed" && detail ? `${base} ${detail}` : base;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Не получилось зарегистрироваться</AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
