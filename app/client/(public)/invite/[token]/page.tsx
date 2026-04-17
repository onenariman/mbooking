import { Card, CardContent } from "@/components/ui/card";
import { ClientInviteActivationForm } from "@/client/components/ClientInviteActivationForm";

export default async function ClientInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
      <Card className="w-full">
        <CardContent className="pt-6">
          <ClientInviteActivationForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
