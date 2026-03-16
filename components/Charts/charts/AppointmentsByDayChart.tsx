import { TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { appointmentsChartConfig } from "../lib/constants";
import type { AppointmentsByDayPoint } from "../lib/types";

type AppointmentsByDayChartProps = {
  data: AppointmentsByDayPoint[];
  categoryLabel: string;
};

export default function AppointmentsByDayChart({
  data,
  categoryLabel,
}: AppointmentsByDayChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Динамика записей по дням
        </CardTitle>
        <CardDescription>
          Данные по категории: {categoryLabel}. Столбцы — все записи, линия —
          завершённые.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">
            За выбранный период нет записей.
          </p>
        ) : (
          <ChartContainer config={appointmentsChartConfig} className="h-72 w-full">
            <ComposedChart data={data} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="dateKey"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                tickFormatter={(value) => {
                  const parsed = Date.parse(String(value));
                  if (Number.isNaN(parsed)) return "";
                  return format(new Date(parsed), "d", { locale: ru });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelKey="dateKey"
                    labelFormatter={(value) => {
                      if (!value) return "";
                      const parsed = Date.parse(String(value));
                      if (Number.isNaN(parsed)) return "";
                      return format(new Date(parsed), "dd MMM yyyy", {
                        locale: ru,
                      });
                    }}
                    formatter={(value, name) => {
                      const label =
                        name === "appointments" ? "Все записи" : "Завершено";
                      return (
                        <div className="flex w-full items-center justify-between gap-2">
                          <span>{label}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {Number(value).toLocaleString("ru-RU")}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="appointments"
                fill="var(--color-appointments)"
                radius={[6, 6, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--color-completed)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
