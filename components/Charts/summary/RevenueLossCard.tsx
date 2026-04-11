import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currencyFormatter, percentFormatter } from "../lib/constants";
import type { RevenueLossMetrics } from "../lib/types";

type RevenueLossCardProps = {
  metrics: RevenueLossMetrics;
  categoryLabel: string;
};

export default function RevenueLossCard({
  metrics,
  categoryLabel,
}: RevenueLossCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
          Потери (отмены и неявки)
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {categoryLabel}. План = факт + отмены + неявки.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border/70 px-3 py-3">
            <div className="text-xs text-muted-foreground">Плановая выручка</div>
            <div className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">
              {currencyFormatter.format(metrics.plannedRevenue)}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 px-3 py-3">
            <div className="text-xs text-muted-foreground">Факт</div>
            <div className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">
              {currencyFormatter.format(metrics.actualRevenue)}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 px-3 py-3">
            <div className="text-xs text-muted-foreground">Потери</div>
            <div className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">
              {currencyFormatter.format(metrics.lostRevenue)}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 px-3 py-3">
            <div className="text-xs text-muted-foreground">Выполнение плана</div>
            <div className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">
              {percentFormatter.format(metrics.planCompletionRate)}%
            </div>
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
          <p>
            Отмены:{" "}
            <span className="font-medium text-foreground">
              {currencyFormatter.format(metrics.cancelledLossRevenue)}
            </span>
          </p>
          <p>
            Неявки:{" "}
            <span className="font-medium text-foreground">
              {currencyFormatter.format(metrics.noShowLossRevenue)}
            </span>
          </p>
          <p>
            Доля потерь:{" "}
            <span className="font-medium text-foreground">
              {percentFormatter.format(metrics.lossRate)}%
            </span>
          </p>
          <p>
            Записей с потерями:{" "}
            <span className="font-medium text-foreground">{metrics.lostAppointmentsCount}</span>
            {", с ценой: "}
            <span className="font-medium text-foreground">{metrics.pricedLostAppointmentsCount}</span>
            {metrics.unpricedLostAppointmentsCount > 0
              ? `, без цены: ${metrics.unpricedLostAppointmentsCount}`
              : ""}
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
