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
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Всего записей</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalAppointments}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Завершено {metrics.completedAppointmentsCount} из {metrics.totalAppointments}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardDescription>Клиенты</CardDescription>
            <CardTitle className="text-3xl">{metrics.uniqueClientsCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Новые: {metrics.newClientsCount} | Повторные: {metrics.repeatClientsCount}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardDescription>Выручка</CardDescription>
            <CardTitle className="text-3xl">{currencyFormatter.format(metrics.revenue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Средний чек: {currencyFormatter.format(metrics.averageCheck)}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardDescription>Конверсия в завершение</CardDescription>
            <CardTitle className="text-3xl">
              {percentFormatter.format(metrics.conversionToCompleted)}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Отмены и неявки: {metrics.cancelledAppointments}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
