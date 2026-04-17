import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSettingsForm } from "@/client/components/ClientSettingsForm";
import { getClientPortalContextFromSession } from "@/client/server/context";
import type { ClientPortalMe } from "@/src/api/clientPortal.api";
import { formatPhoneDisplay } from "@/src/validators/normalizePhone";

export default async function ClientSettingsPage() {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    redirect("/client/login");
  }

  const initialMe: ClientPortalMe = {
    auth_user_id: context.authUserId,
    phone: context.profile.phone,
    email: context.profile.email,
    display_name: context.profile.display_name,
    notifications_enabled: context.profile.notifications_enabled,
    client_reminder_offsets_minutes:
      context.profile.client_reminder_offsets_minutes,
    quiet_hours_start_utc: context.profile.quiet_hours_start_utc,
    quiet_hours_end_utc: context.profile.quiet_hours_end_utc,
    active_owner_user_id: context.ownerUserId,
    linked_businesses_count: context.links.length,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
          <CardDescription>
            Номер телефона привязан к кабинету. Его меняет мастер в карточке
            клиента.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">
            {formatPhoneDisplay(context.clientPhone)}
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
          <CardDescription>
            Email, уведомления и напоминания о ваших записях.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientSettingsForm initialMe={initialMe} />
        </CardContent>
      </Card>
    </div>
  );
}
