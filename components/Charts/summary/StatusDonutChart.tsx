"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { statusChartConfig, statusLabels } from "../lib/constants";
import type { StatusSummaryItem } from "../lib/types";

type StatusDonutChartProps = {
  statusSummary: StatusSummaryItem[];
};

export default function StatusDonutChart({
  statusSummary,
}: StatusDonutChartProps) {
  const chartData = statusSummary.map((item) => ({
    key: item.key,
    value: item.value,
    label: statusLabels[item.key],
    fill: `var(--color-${item.key})`,
  }));

  const total = chartData.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Нет данных
      </div>
    );
  }

  return (
    <ChartContainer
      config={statusChartConfig}
      className="h-60 w-full aspect-square"
    >
      <PieChart margin={{ top: 0, right: 0, bottom: 24, left: 0 }}>
        <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="key"
          innerRadius={48}
          outerRadius={80}
          paddingAngle={2}
          strokeWidth={2}
        />
        <ChartLegend
          verticalAlign="bottom"
          content={<ChartLegendContent nameKey="key" />}
        />
      </PieChart>
    </ChartContainer>
  );
}
