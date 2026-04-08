import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientInviteActivationForm } from "@/components/ClientPortal/ClientInviteActivationForm";

export default async function ClientInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Активация кабинета</CardTitle>
          <CardDescription>
            Укажите email и задайте пароль для входа в личный кабинет клиента.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientInviteActivationForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
