import RawFeedbackSection from "@/components/Recommendations/RawFeedbackSection";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function RawFeedbackPage() {
  await requireOwnerPageSession();
  return (
    <div className="mx-auto w-full max-w-2xl pb-24 md:max-w-5xl md:pb-10 min-h-dvh">
      <RawFeedbackSection />
    </div>
  );
}
