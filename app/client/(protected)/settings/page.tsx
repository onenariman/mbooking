import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSettingsForm } from "@/client/components/ClientSettingsForm";
import { getClientPortalContextFromSession } from "@/client/server/context";
import { formatPhoneDisplay } from "@/src/validators/normalizePhone";

export default async function ClientSettingsPage() {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    redirect("/client/login");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
          <CardDescription>
            Номер телефона, который привязан к вашему клиентскому кабинету.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">
            {formatPhoneDisplay(context.clientPhone)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
          <CardDescription>
            Здесь постепенно появятся настройки клиентских уведомлений и безопасности.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientSettingsForm
            initialNotificationsEnabled={context.profile.notifications_enabled}
          />
        </CardContent>
      </Card>
    </div>
  );
}
