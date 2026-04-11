import ChartsPageClient from "@/app/charts/ChartsPageClient";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function ChartsPage() {
  await requireOwnerPageSession();
  return <ChartsPageClient />;
}
