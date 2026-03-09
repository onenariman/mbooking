import SubmitFeedbackForm from "@/components/Feedback/SubmitFeedbackForm";

interface FeedbackPageProps {
  params:
    | {
        token: string;
      }
    | Promise<{
        token: string;
      }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const token = resolvedParams?.token ?? "";

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full items-center py-8">
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Некорректная ссылка отзыва.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full items-center py-8">
      <SubmitFeedbackForm token={token} />
    </div>
  );
}
