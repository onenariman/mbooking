"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { FeedbackRatingsTrend } from "@/src/api/feedback.api";

const ratingChartConfig = {
  score_result: {
    label: "Результат",
    color: "hsl(var(--chart-1))",
  },
  score_explanation: {
    label: "Объяснения",
    color: "hsl(var(--chart-2))",
  },
  score_comfort: {
    label: "Комфорт",
    color: "hsl(var(--chart-3))",
  },
  score_booking: {
    label: "Запись",
    color: "hsl(var(--chart-4))",
  },
  score_recommendation: {
    label: "Рекомендация",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const ratingLabels: Record<string, string> = {
  score_result: "Результат",
  score_explanation: "Объяснения",
  score_comfort: "Комфорт",
  score_booking: "Запись",
  score_recommendation: "Рекомендация",
};

type FeedbackRatingsChartProps = {
  data: FeedbackRatingsTrend[];
  isLoading: boolean;
  periodLabel: string;
};

export default function FeedbackRatingsChart({
  data,
  isLoading,
  periodLabel,
}: FeedbackRatingsChartProps) {
  const hasData = data.some((item) => item.sampleSize > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Средние оценки по вопросам</CardTitle>
        <CardDescription>
          Средние значения по шкале от 1 до 5 за выбранный диапазон ({periodLabel}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Загружаем оценки...
          </div>
        ) : !hasData ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Нет данных по оценкам за выбранный диапазон.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => {
              const chartKey =
                item.key in ratingChartConfig ? item.key : "score_result";
              const shortLabel = ratingLabels[item.key] ?? item.label;
              const value = item.avg ?? 0;
              const chartData = [
                {
                  key: chartKey,
                  value,
                  fill: `var(--color-${chartKey})`,
                  sampleSize: item.sampleSize,
                  label: shortLabel,
                },
              ];

              return (
                <div
                  key={item.key}
                  className="rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium leading-none">
                        {shortLabel}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.sampleSize > 0
                          ? `${item.sampleSize} отзывов`
                          : "Нет оценок"}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {item.avg === null ? "н/д" : `${item.avg.toFixed(1)}/5`}
                    </span>
                  </div>

                  <div className="relative mt-4 flex justify-center">
                    <ChartContainer
                      config={ratingChartConfig}
                      className="h-40 w-full max-w-[160px] aspect-square"
                    >
                      <RadialBarChart
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="72%"
                        outerRadius="100%"
                        accessibilityLayer
                      >
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 5]}
                          tick={false}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(tooltipValue, _name, tooltipItem) => (
                                <div className="flex w-full items-center justify-between gap-3">
                                  <span>{tooltipItem.payload?.label}</span>
                                  <span className="font-medium tabular-nums">
                                    {Number(tooltipValue).toFixed(1)}/5
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                        <RadialBar
                          dataKey="value"
                          background
                          cornerRadius={12}
                          clockWise
                        />
                      </RadialBarChart>
                    </ChartContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-semibold tabular-nums">
                        {item.avg === null ? "—" : item.avg.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">из 5</span>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
