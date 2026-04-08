import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registerOwner } from "./action";
import { RegisterAuthMessages } from "@/components/auth/OwnerAuthMessages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  if (process.env.NEXT_PUBLIC_OWNER_REGISTRATION_ENABLED === "false") {
    redirect("/?error=registration-disabled");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Регистрация мастера</CardTitle>
          <CardDescription>
            Укажите email и пароль. Если в проекте включено подтверждение почты, после регистрации
            проверьте входящие и перейдите по ссылке из письма.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <RegisterAuthMessages />
          </Suspense>
          <form action={registerOwner} className="grid gap-4">
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
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password_confirm">Повтор пароля</Label>
              <Input
                id="password_confirm"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full">
              Зарегистрироваться
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/" className="text-foreground font-medium underline underline-offset-4">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
