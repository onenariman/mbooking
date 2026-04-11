import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currencyFormatter, percentFormatter } from "../lib/constants";
import type { Metrics } from "../lib/types";

type MetricsCardsProps = {
  title: string;
  subtitle: string;
  metrics: Metrics;
};

export default function MetricsCards({
  title,
  subtitle,
  metrics,
}: MetricsCardsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card px-3 py-3 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Всего записей</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {metrics.totalAppointments}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Завершено {metrics.completedAppointmentsCount}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card px-3 py-3 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Клиенты</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {metrics.uniqueClientsCount}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Новые {metrics.newClientsCount} · Повторные {metrics.repeatClientsCount}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card px-3 py-3 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Выручка</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums leading-tight">
            {currencyFormatter.format(metrics.revenue)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Средний чек {currencyFormatter.format(metrics.averageCheck)}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card px-3 py-3 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">Завершение</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {percentFormatter.format(metrics.conversionToCompleted)}%
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Отмены и неявки: {metrics.cancelledAppointments}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
