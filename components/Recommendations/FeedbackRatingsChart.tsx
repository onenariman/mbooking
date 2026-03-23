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
  avg: {
    label: "Средняя оценка",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

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
  const chartData = data.map((item) => ({
    label: item.label,
    avg: item.avg ?? 0,
    sampleSize: item.sampleSize,
  }));

  const hasData = data.some((item) => item.sampleSize > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Средние оценки по вопросам</CardTitle>
        <CardDescription>
          Оценки по шкале от 1 до 5 за выбранный диапазон ({periodLabel}).
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
          <>
            <ChartContainer config={ratingChartConfig} className="h-72 w-full">
              <BarChart data={chartData} layout="vertical" accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={180}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x}
                      y={y}
                      dy={3}
                      textAnchor="end"
                      className={cn("fill-muted-foreground text-xs")}
                    >
                      {String(payload.value).slice(0, 28)}
                    </text>
                  )}
                />
                <XAxis
                  dataKey="avg"
                  type="number"
                  domain={[0, 5]}
                  tickFormatter={(value) => `${value}/5`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <div className="flex w-full items-center justify-between gap-2">
                          <span>{value}/5</span>
                          <span className="text-muted-foreground">
                            {item.payload?.sampleSize ?? 0} отзывов
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="avg" fill="var(--color-avg)" radius={6} />
              </BarChart>
            </ChartContainer>

            <div className="mt-4 grid gap-2 text-sm">
              {data.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>
                    {item.avg === null ? "н/д" : `${item.avg.toFixed(1)}/5`}
                    {item.sampleSize > 0 ? ` (${item.sampleSize} отзывов)` : ""}
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
