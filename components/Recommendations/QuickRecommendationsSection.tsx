"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InsufficientFeedbackError,
  runRecommendationJob,
  waitForRecommendationJob,
} from "@/src/api/feedback.api";
import {
  useDeleteRecommendation,
  useGenerateRecommendations,
  useRecommendations,
} from "@/src/hooks/feedback.hooks";
import { ZodRecommendationPeriod } from "@/src/schemas/feedback/feedbackSchema";
import RecommendationsList from "./RecommendationsList";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";

type PeriodOption = {
  value: ZodRecommendationPeriod;
  label: string;
};

const periodOptions: PeriodOption[] = [
  { value: "week", label: "РќРµРґРµР»СЏ" },
  { value: "month", label: "РњРµСЃСЏС†" },
  { value: "3m", label: "3 РјРµСЃСЏС†Р°" },
  { value: "6m", label: "6 РјРµСЃСЏС†РµРІ" },
  { value: "9m", label: "9 РјРµСЃСЏС†РµРІ" },
  { value: "12m", label: "12 РјРµСЃСЏС†РµРІ" },
];

export default function QuickRecommendationsSection() {
  const [period, setPeriod] = useState<ZodRecommendationPeriod>("month");
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { data: recommendations = [], isLoading } = useRecommendations(period);
  const { mutateAsync: generateRecommendation, isPending } =
    useGenerateRecommendations();
  const { mutateAsync: deleteRecommendation, isPending: isDeleting } =
    useDeleteRecommendation();
  const isBusy = isPending || isGenerating;

  const periodLabel = useMemo(
    () => periodOptions.find((option) => option.value === period)?.label ?? period,
    [period],
  );

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const job = await generateRecommendation({ period });

      if (job.status === "succeeded") {
        await queryClient.invalidateQueries({
          queryKey: ["ai-recommendations", period],
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
        queryKey: ["ai-recommendations", period],
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

  const handlePeriodChange = (value: string) => {
    if (periodOptions.some((option) => option.value === value)) {
      setPeriod(value as ZodRecommendationPeriod);
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
      <RecommendationsBreadcrumb current="Р‘С‹СЃС‚СЂС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё" />
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Р‘С‹СЃС‚СЂС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё</CardTitle>
            <CardDescription>
              РЎРІРѕРґРЅС‹Рµ СЂРµРєРѕРјРµРЅРґР°С†РёРё РЅР° РѕСЃРЅРѕРІРµ РѕС‚Р·С‹РІРѕРІ Р·Р° РІС‹Р±СЂР°РЅРЅС‹Р№ РїРµСЂРёРѕРґ.
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={handleGenerate} disabled={isBusy}>
            {isBusy ? <Spinner className="mr-1" /> : <Sparkles className="h-4 w-4" />}
            {isBusy ? "Р“РµРЅРµСЂР°С†РёСЏ..." : "РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">РџРµСЂРёРѕРґ Р°РЅР°Р»РёР·Р°:</span>
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
                {periodOptions.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="h-8 px-3 text-xs"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="text-xs text-muted-foreground">
            РЎРѕРІРµС‚: РґР»СЏ СѓСЃС‚РѕР№С‡РёРІС‹С… СЂРµРєРѕРјРµРЅРґР°С†РёР№ Р¶РµР»Р°С‚РµР»СЊРЅРѕ РјРёРЅРёРјСѓРј 3 РѕС‚Р·С‹РІР° Р·Р°
            РїРµСЂРёРѕРґ.
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Р—Р°РіСЂСѓР¶Р°РµРј СЂРµРєРѕРјРµРЅРґР°С†РёРё...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Р—Р° РІС‹Р±СЂР°РЅРЅС‹Р№ РїРµСЂРёРѕРґ РїРѕРєР° РЅРµС‚ СЂРµРєРѕРјРµРЅРґР°С†РёР№. РќР°Р¶РјРёС‚Рµ
              В«РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРёВ», С‡С‚РѕР±С‹ СЃРѕР·РґР°С‚СЊ РїРµСЂРІСѓСЋ СЃРІРѕРґРєСѓ.
            </div>
          ) : (
            <RecommendationsList
              recommendations={recommendations}
              periodLabel={periodLabel}
              isDeleting={isDeleting}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


