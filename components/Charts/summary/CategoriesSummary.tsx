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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Категории за период</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Записи, завершения и доля выручки — один блок на категорию.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {categoriesSummary.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            В выбранном периоде нет данных.
          </p>
        ) : (
          categoriesSummary.map((item) => (
            <div
              key={item.category}
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
                activeCategory === item.category && "border-primary/50 bg-primary/5",
              )}
            >
              <div className="font-semibold">{item.category}</div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-4 sm:text-sm">
                <span>
                  Записей:{" "}
                  <span className="font-medium text-foreground">{item.totalAppointments}</span>
                </span>
                <span>
                  Завершено:{" "}
                  <span className="font-medium text-foreground">{item.completedAppointments}</span>
                </span>
                <span className="text-foreground">
                  {currencyFormatter.format(item.revenue)}{" "}
                  <span className="text-muted-foreground">
                    ({percentFormatter.format(item.revenueShare)}%)
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
