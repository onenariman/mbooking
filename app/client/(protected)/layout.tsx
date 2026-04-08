import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ClientPortalHeader } from "@/components/ClientPortal/ClientPortalHeader";
import { formatPhoneDisplay } from "@/src/validators/normalizePhone";
import { getClientPortalContextFromSession } from "@/src/server/client-portal/context";

export default async function ClientProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    redirect("/client/login");
  }

  const title = context.profile.display_name || "Ваш кабинет";
  const subtitle = `Телефон: ${formatPhoneDisplay(context.clientPhone)}`;

  return (
    <div className="space-y-6 py-2">
      <ClientPortalHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}
