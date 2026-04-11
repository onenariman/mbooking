import RecommendationsSection from "@/components/Recommendations";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

const RecommendationsPage = async () => {
  await requireOwnerPageSession();
  return (
    <div className="mx-auto w-full max-w-2xl pb-24 md:max-w-5xl md:pb-10 min-h-dvh">
      <RecommendationsSection />
    </div>
  );
};

export default RecommendationsPage;
