import { ListOrdered } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currencyFormatter } from "../lib/constants";
import type { RevenueByServicePoint } from "../lib/types";

const TOP_N = 6;

type RevenueByServiceChartProps = {
  data: RevenueByServicePoint[];
  categoryLabel: string;
};

/**
 * Топ услуг: название полностью сверху (перенос длинных слов), полоска выручки и сумма снизу —
 * без обрезки под узкий Y-axis в recharts.
 */
export default function RevenueByServiceChart({
  data,
  categoryLabel,
}: RevenueByServiceChartProps) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.length - top.length;
  const maxRevenue = Math.max(1, ...top.map((d) => d.revenue));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListOrdered className="h-4 w-4 shrink-0 text-primary" />
          Топ услуг по выручке
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Завершённые записи, {categoryLabel}.
          {rest > 0 ? ` Показано ${TOP_N} из ${sorted.length}.` : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
        {top.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Нет данных по завершённым услугам.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {top.map((row, index) => {
              const widthPct = (row.revenue / maxRevenue) * 100;
              return (
                <li key={`${row.service}-${index}`} className="min-w-0">
                  <p
                    className="text-sm font-medium leading-snug text-foreground [overflow-wrap:anywhere] break-words hyphens-auto"
                    lang="ru"
                  >
                    {row.service}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                      role="presentation"
                      aria-hidden
                    >
                      <div
                        className="h-full min-w-[2px] rounded-full bg-primary"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                      {currencyFormatter.format(row.revenue)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
