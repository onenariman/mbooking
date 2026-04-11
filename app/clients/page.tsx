import ClientsPageClient from "@/app/clients/ClientsPageClient";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function ClientPage() {
  await requireOwnerPageSession();
  return <ClientsPageClient />;
}
