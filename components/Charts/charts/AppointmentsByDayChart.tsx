import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
        <CardDescription>Данные по категории: {categoryLabel}.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-14 text-center text-sm text-muted-foreground">
            За выбранный период нет записей.
          </p>
        ) : (
          <ChartContainer config={appointmentsChartConfig} className="h-72 w-full">
            <BarChart data={data} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
              />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="appointments"
                fill="var(--color-appointments)"
                radius={[6, 6, 0, 0]}
              />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
