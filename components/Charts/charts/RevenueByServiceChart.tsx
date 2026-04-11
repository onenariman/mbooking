import { ListOrdered } from "lucide-react";
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
} from "@/components/ui/chart";
import { cn } from "@/src/lib/utils";
import { currencyFormatter, revenueChartConfig } from "../lib/constants";
import type { RevenueByServicePoint } from "../lib/types";

const TOP_N = 6;

type RevenueByServiceChartProps = {
  data: RevenueByServicePoint[];
  categoryLabel: string;
};

/** Горизонтальный bar только для топ-N услуг — меньше серий и проще на узком экране. */
export default function RevenueByServiceChart({
  data,
  categoryLabel,
}: RevenueByServiceChartProps) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.length - top.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListOrdered className="h-4 w-4 shrink-0 text-primary" />
          Топ услуг по выручке
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Завершённые записи, {categoryLabel}.
          {rest > 0 ? ` Показано ${TOP_N} из ${sorted.length}.` : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2 pt-0 sm:px-4 sm:pb-4">
        {top.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Нет данных по завершённым услугам.
          </p>
        ) : (
          <ChartContainer
            config={revenueChartConfig}
            className="aspect-[4/5] w-full max-h-80 sm:aspect-[16/11] sm:max-h-72"
          >
            <BarChart
              data={top}
              layout="vertical"
              accessibilityLayer
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="4 4" className="stroke-border/60" />
              <YAxis
                dataKey="service"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={3}
                    textAnchor="end"
                    className={cn("fill-muted-foreground text-[11px] leading-tight")}
                  >
                    {String(payload.value).length > 16
                      ? `${String(payload.value).slice(0, 15)}…`
                      : String(payload.value)}
                  </text>
                )}
              />
              <XAxis type="number" dataKey="revenue" hide />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <span className="font-mono tabular-nums">
                        {currencyFormatter.format(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
