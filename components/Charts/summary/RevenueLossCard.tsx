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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Потери выручки из-за отмен и неявок
        </CardTitle>
        <CardDescription>
          План-факт по категории: {categoryLabel}. План = факт + отмены + неявки.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">Плановая выручка</div>
            <div className="mt-2 text-2xl font-semibold">
              {currencyFormatter.format(metrics.plannedRevenue)}
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">Фактическая выручка</div>
            <div className="mt-2 text-2xl font-semibold">
              {currencyFormatter.format(metrics.actualRevenue)}
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">Потери выручки</div>
            <div className="mt-2 text-2xl font-semibold">
              {currencyFormatter.format(metrics.lostRevenue)}
            </div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">Выполнение плана</div>
            <div className="mt-2 text-2xl font-semibold">
              {percentFormatter.format(metrics.planCompletionRate)}%
            </div>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>
            Отмены:{" "}
            <span className="text-foreground">
              {currencyFormatter.format(metrics.cancelledLossRevenue)}
            </span>
          </p>
          <p>
            Неявки:{" "}
            <span className="text-foreground">
              {currencyFormatter.format(metrics.noShowLossRevenue)}
            </span>
          </p>
          <p>
            Доля потерь от плана:{" "}
            <span className="text-foreground">
              {percentFormatter.format(metrics.lossRate)}%
            </span>
          </p>
          <p>
            Записей с потерями:{" "}
            <span className="text-foreground">{metrics.lostAppointmentsCount}</span>
            {", оценено по цене: "}
            <span className="text-foreground">{metrics.pricedLostAppointmentsCount}</span>
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
