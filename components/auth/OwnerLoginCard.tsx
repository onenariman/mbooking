import { Suspense } from "react";
import { LoginAuthMessages } from "@/components/auth/OwnerAuthMessages";
import { OwnerYandexAuthBlock } from "@/components/auth/OwnerYandexAuthPlaceholder";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OwnerLoginCard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход в систему</CardTitle>
          <CardDescription>
            Вход для мастера через Яндекс ID. Если аккаунта ещё нет, он создаётся при
            первом успешном входе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginAuthMessages />
          </Suspense>
          <OwnerYandexAuthBlock />
        </CardContent>
      </Card>
    </div>
  );
}
