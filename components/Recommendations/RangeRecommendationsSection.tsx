"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DateRangeFilter from "@/components/Charts/filters/DateRangeFilter";
import { getDefaultRange, getRangeLabel } from "@/components/Charts/lib/constants";
import {
  InsufficientFeedbackError,
  runRecommendationJob,
  waitForRecommendationJob,
} from "@/src/api/feedback.api";
import {
  useDeleteRecommendation,
  useGenerateRecommendations,
  useRecommendationsByRange,
} from "@/src/hooks/feedback.hooks";
import RecommendationsList from "./RecommendationsList";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";

const toDateOnlyIso = (date: Date) => date.toISOString().slice(0, 10);

export default function RangeRecommendationsSection() {
  const [range, setRange] = useState<DateRange | undefined>(getDefaultRange());
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: generateRecommendation, isPending } =
    useGenerateRecommendations();
  const { mutateAsync: deleteRecommendation, isPending: isDeleting } =
    useDeleteRecommendation();
  const isBusy = isPending || isGenerating;

  const hasRange = Boolean(range?.from && range?.to);
  const rangeLabel = getRangeLabel(range);

  const rangeKey = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    return {
      from: toDateOnlyIso(range.from),
      to: toDateOnlyIso(range.to),
    };
  }, [range]);

  const { data: recommendations = [], isLoading } = useRecommendationsByRange(
    rangeKey?.from ?? null,
    rangeKey?.to ?? null,
  );

  const handleGenerate = async () => {
    if (!rangeKey) {
      toast.error("Р’С‹Р±РµСЂРёС‚Рµ РґРёР°РїР°Р·РѕРЅ РґР°С‚");
      return;
    }

    try {
      setIsGenerating(true);
      const job = await generateRecommendation({ from: rangeKey.from, to: rangeKey.to });

      if (job.status === "succeeded") {
        await queryClient.invalidateQueries({
          queryKey: ["ai-recommendations-range", rangeKey.from, rangeKey.to],
        });
        toast.success("Р РµРєРѕРјРµРЅРґР°С†РёРё РѕР±РЅРѕРІР»РµРЅС‹");
        return;
      }

      if (job.status === "queued") {
        runRecommendationJob(job.id).catch((error) => {
          console.error("Failed to start recommendation job", error);
        });
      }

      toast.info("Р—Р°РїСЂРѕСЃ РЅР° РіРµРЅРµСЂР°С†РёСЋ РїСЂРёРЅСЏС‚");
      await waitForRecommendationJob(job.id);
      await queryClient.invalidateQueries({
        queryKey: ["ai-recommendations-range", rangeKey.from, rangeKey.to],
      });
      toast.success("Р РµРєРѕРјРµРЅРґР°С†РёРё РѕР±РЅРѕРІР»РµРЅС‹");
    } catch (error) {
      if (error instanceof InsufficientFeedbackError) {
        toast.error("РњРёРЅРёРјСѓРј 3 РѕС‚Р·С‹РІР° РЅСѓР¶РЅРѕ РґР»СЏ РіРµРЅРµСЂР°С†РёРё");
        return;
      }
      toast.error(getErrorMessage(error, "РћС€РёР±РєР° РіРµРЅРµСЂР°С†РёРё"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (recommendationId: string) => {
    const confirmed = window.confirm("РЈРґР°Р»РёС‚СЊ СЌС‚Сѓ СЂРµРєРѕРјРµРЅРґР°С†РёСЋ?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteRecommendation(recommendationId);
      toast.success("Р РµРєРѕРјРµРЅРґР°С†РёСЏ СѓРґР°Р»РµРЅР°");
    } catch (error) {
      toast.error(getErrorMessage(error, "РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ"));
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Р РµРєРѕРјРµРЅРґР°С†РёРё РїРѕ РґР°С‚Р°Рј" />
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Р РµРєРѕРјРµРЅРґР°С†РёРё РїРѕ РґР°С‚Р°Рј</CardTitle>
            <CardDescription>
              РЎРІРѕРґРЅС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё РЅР° РѕСЃРЅРѕРІРµ РѕС‚Р·С‹РІРѕРІ Р·Р° РІС‹Р±СЂР°РЅРЅС‹Р№ РґРёР°РїР°Р·РѕРЅ.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={handleGenerate} disabled={isBusy}>
            {isBusy ? <Spinner className="mr-1" /> : <Sparkles className="h-4 w-4" />}
            {isBusy ? "Р“РµРЅРµСЂР°С†РёСЏ..." : "РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <DateRangeFilter
            range={range}
            onChange={setRange}
            onResetToCurrentMonth={() => setRange(getDefaultRange())}
            hasSelectedRange={hasRange}
          />
          <div className="text-xs text-muted-foreground">
            Р’С‹Р±СЂР°РЅРЅС‹Р№ РґРёР°РїР°Р·РѕРЅ: {rangeLabel}
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Р—Р°РіСЂСѓР¶Р°РµРј СЂРµРєРѕРјРµРЅРґР°С†РёРё...
            </div>
          ) : !rangeKey ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Р’С‹Р±РµСЂРёС‚Рµ РґРёР°РїР°Р·РѕРЅ РґР°С‚, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё.
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Р—Р° РІС‹Р±СЂР°РЅРЅС‹Р№ РґРёР°РїР°Р·РѕРЅ РїРѕРєР° РЅРµС‚ СЂРµРєРѕРјРµРЅРґР°С†РёР№. РќР°Р¶РјРёС‚Рµ
              В«РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРёВ», С‡С‚РѕР±С‹ СЃРѕР·РґР°С‚СЊ РїРµСЂРІСѓСЋ СЃРІРѕРґРєСѓ.
            </div>
          ) : (
            <RecommendationsList
              recommendations={recommendations}
              periodLabel={rangeLabel}
              isDeleting={isDeleting}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


