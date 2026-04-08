"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { clientPortalLogin } from "@/app/client/(public)/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ClientLoginErrors() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (!error) return null;
  const text =
    error === "auth-failed"
      ? "Неверный email или пароль."
      : error === "wrong-role"
        ? "Этот аккаунт не является клиентским кабинетом. Войдите в панель мастера."
        : error === "nest-unconfigured"
          ? "Сервер не настроен (Nest URL)."
          : "Не удалось войти.";
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}

export function ClientLoginForm() {
  return (
    <>
      <Suspense fallback={null}>
        <ClientLoginErrors />
      </Suspense>
      <form className="grid gap-4" action={clientPortalLogin}>
        <div className="grid gap-2">
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            name="email"
            type="email"
            placeholder="client@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="client-password">Пароль</Label>
          <Input
            id="client-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Войти
        </Button>
      </form>
    </>
  );
}
