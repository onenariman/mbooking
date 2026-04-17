import OrganizationPageClient from "@/app/organization/OrganizationPageClient";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function OrganizationPage() {
  await requireOwnerPageSession();
  return <OrganizationPageClient />;
}

