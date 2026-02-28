import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { statusLabels } from "../lib/constants";
import type { StatusSummaryItem } from "../lib/types";

type StatusSummaryProps = {
  statusSummary: StatusSummaryItem[];
  categoryLabel: string;
};

export default function StatusSummary({
  statusSummary,
  categoryLabel,
}: StatusSummaryProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Разбивка по статусам
        </CardTitle>
        <CardDescription>По категории: {categoryLabel}.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statusSummary.map((item) => (
          <div key={item.key} className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">{statusLabels[item.key]}</div>
            <div className="mt-2 text-2xl font-semibold">{item.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
