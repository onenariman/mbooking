"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { cn } from "@/src/lib/utils";

const ratingChartConfig = {
  percent: {
    label: "Рейтинг",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

type FeedbackRatingsChartProps = {
  data: FeedbackRatingsTrend[];
  isLoading: boolean;
  periodLabel: string;
};

const formatDelta = (value: number | null) => {
  if (value === null) return "н/д";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
};

const deltaClassName = (value: number | null) => {
  if (value === null || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-emerald-600" : "text-red-600";
};

export default function FeedbackRatingsChart({
  data,
  isLoading,
  periodLabel,
}: FeedbackRatingsChartProps) {
  const chartData = data.map((item) => ({
    label: item.label,
    percent: item.percent ?? 0,
    avg: item.avg,
    delta: item.delta,
    sampleSize: item.sampleSize,
  }));

  const hasData = data.some((item) => item.sampleSize > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рейтинг по вопросам</CardTitle>
        <CardDescription>
          Нормировано до 100% и сравнение с предыдущим периодом ({periodLabel}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Загружаем рейтинги...
          </div>
        ) : !hasData ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Нет данных для рейтингов за выбранный период.
          </div>
        ) : (
          <>
            <ChartContainer config={ratingChartConfig} className="h-72 w-full">
              <BarChart data={chartData} layout="vertical" accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={170}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x}
                      y={y}
                      dy={3}
                      textAnchor="end"
                      className={cn("fill-muted-foreground text-xs")}
                    >
                      {String(payload.value).slice(0, 24)}
                    </text>
                  )}
                />
                <XAxis
                  dataKey="percent"
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => {
                        const avg = item.payload?.avg;
                        const avgText =
                          avg === null ? "н/д" : `${avg.toFixed(1)}/5`;
                        return (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span>{value}%</span>
                            <span className="text-muted-foreground">
                              {avgText}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="percent" fill="var(--color-percent)" radius={6} />
              </BarChart>
            </ChartContainer>

            <div className="mt-4 grid gap-2 text-sm">
              {data.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={deltaClassName(item.delta)}>
                    Δ {formatDelta(item.delta)}
                    {item.sampleSize > 0 ? ` (n=${item.sampleSize})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
