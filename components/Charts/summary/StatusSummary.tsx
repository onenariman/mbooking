"use client";

import { PieChart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { statusLabels, statusLabelsFull } from "../lib/constants";
import type { StatusSummaryItem } from "../lib/types";

type StatusSummaryProps = {
  statusSummary: StatusSummaryItem[];
  categoryLabel: string;
};

/** Без donut: только сетка карточек — меньше Recharts, один столбец на мобильном. */
export default function StatusSummary({
  statusSummary,
  categoryLabel,
}: StatusSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChart className="h-4 w-4 shrink-0 text-primary" />
          Статусы записей
        </CardTitle>
        <CardDescription className="text-xs">
          Категория: {categoryLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {statusSummary.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/10 px-3 py-3"
            >
              <div
                className="text-xs font-medium text-muted-foreground"
                title={statusLabelsFull[item.key]}
              >
                {statusLabels[item.key]}
              </div>
              <div className="text-xl font-semibold tabular-nums">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
