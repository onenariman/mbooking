import { DollarSign } from "lucide-react";
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
import { revenueChartConfig } from "../lib/constants";
import type { RevenueByServicePoint } from "../lib/types";

type RevenueByServiceChartProps = {
  data: RevenueByServicePoint[];
  categoryLabel: string;
};

export default function RevenueByServiceChart({
  data,
  categoryLabel,
}: RevenueByServiceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Топ услуг по выручке
        </CardTitle>
        <CardDescription>
          Только завершённые записи по категории: {categoryLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">
            Нет данных по завершённым услугам.
          </p>
        ) : (
          <ChartContainer config={revenueChartConfig} className="h-72 w-full">
            <BarChart data={data} layout="vertical" accessibilityLayer>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="service"
                type="category"
                tickLine={false}
                axisLine={false}
                width={132}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={3}
                    textAnchor="end"
                    className={cn("fill-muted-foreground text-xs")}
                  >
                    {String(payload.value).slice(0, 18)}
                  </text>
                )}
              />
              <XAxis dataKey="revenue" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
