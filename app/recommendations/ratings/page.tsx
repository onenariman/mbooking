import RatingsSection from "@/components/Recommendations/RatingsSection";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function RatingsPage() {
  await requireOwnerPageSession();
  return (
    <div className="mx-auto w-full max-w-2xl pb-24 md:max-w-5xl md:pb-10 min-h-dvh">
      <RatingsSection />
    </div>
  );
}
