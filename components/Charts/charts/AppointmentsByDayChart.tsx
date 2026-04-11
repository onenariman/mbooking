import { CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { appointmentsChartConfig } from "../lib/constants";
import type { AppointmentsByDayPoint } from "../lib/types";

type AppointmentsByDayChartProps = {
  data: AppointmentsByDayPoint[];
  categoryLabel: string;
};

/** Один лёгкий area — записи по дням (без composed bar+line). */
export default function AppointmentsByDayChart({
  data,
  categoryLabel,
}: AppointmentsByDayChartProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarRange className="h-4 w-4 shrink-0 text-primary" />
          Записи по дням
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Категория: {categoryLabel}. Число записей за каждый день периода.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2 pt-0 sm:px-4 sm:pb-4">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            За выбранный период нет записей.
          </p>
        ) : (
          <ChartContainer config={appointmentsChartConfig} className="aspect-[4/3] w-full max-h-64 sm:max-h-72">
            <AreaChart data={data} accessibilityLayer margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fillAppointments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-appointments)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-appointments)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" className="stroke-border/60" />
              <XAxis
                dataKey="dateKey"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                minTickGap={28}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const parsed = Date.parse(String(value));
                  if (Number.isNaN(parsed)) return "";
                  return format(new Date(parsed), "d.MM", { locale: ru });
                }}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelKey="dateKey"
                    labelFormatter={(value) => {
                      if (!value) return "";
                      const parsed = Date.parse(String(value));
                      if (Number.isNaN(parsed)) return "";
                      return format(new Date(parsed), "d MMM yyyy", { locale: ru });
                    }}
                  />
                }
              />
              <Area
                dataKey="appointments"
                type="monotone"
                fill="url(#fillAppointments)"
                stroke="var(--color-appointments)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
