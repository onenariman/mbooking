import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientLoginForm } from "@/client/components/ClientLoginForm";

export default function ClientLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Вход в личный кабинет</CardTitle>
          <CardDescription>
            Войдите по email и паролю от кабинета. Если забыли пароль — попросите у
            мастера ссылку для сброса.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
