import { redirect } from "next/navigation";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function RangeRecommendationsPage() {
  await requireOwnerPageSession();
  redirect("/recommendations");
}
