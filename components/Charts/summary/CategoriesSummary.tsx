import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/src/lib/utils";
import { currencyFormatter, percentFormatter } from "../lib/constants";
import type { CategorySummaryRow } from "../lib/types";

type CategoriesSummaryProps = {
  categoriesSummary: CategorySummaryRow[];
  activeCategory: string;
};

export default function CategoriesSummary({
  categoriesSummary,
  activeCategory,
}: CategoriesSummaryProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Все категории за период</CardTitle>
        <CardDescription>
          Быстрый срез по каждой категории: записи, завершения, выручка и доля в общей выручке.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {categoriesSummary.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">В выбранном периоде нет данных.</p>
        ) : (
          categoriesSummary.map((item) => (
            <div
              key={item.category}
              className={cn(
                "grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-4 sm:items-center",
                activeCategory === item.category && "border-primary",
              )}
            >
              <div className="font-medium">{item.category}</div>
              <div className="text-muted-foreground">
                Записи: <span className="text-foreground">{item.totalAppointments}</span>
              </div>
              <div className="text-muted-foreground">
                Завершено: <span className="text-foreground">{item.completedAppointments}</span>
              </div>
              <div className="text-muted-foreground">
                {currencyFormatter.format(item.revenue)} (
                {percentFormatter.format(item.revenueShare)}%)
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
