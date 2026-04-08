import { Suspense } from "react";
import Link from "next/link";
import { login } from "@/app/login/action";
import { LoginAuthMessages } from "@/components/auth/OwnerAuthMessages";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OwnerLoginCard() {
  const ownerRegistrationOpen =
    process.env.NEXT_PUBLIC_OWNER_REGISTRATION_ENABLED !== "false";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>Введите email и пароль мастера</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginAuthMessages />
          </Suspense>
          <form action={login} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
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
          {ownerRegistrationOpen ? (
            <p className="text-muted-foreground mt-4 text-center text-sm">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="text-foreground font-medium underline underline-offset-4"
              >
                Зарегистрироваться
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
