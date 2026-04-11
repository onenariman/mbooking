import PromptsSection from "@/components/Recommendations/PromptsSection";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

export default async function PromptsPage() {
  await requireOwnerPageSession();
  return (
    <div className="mx-auto w-full max-w-2xl pb-24 md:max-w-5xl md:pb-10 min-h-dvh">
      <PromptsSection />
    </div>
  );
}
