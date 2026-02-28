import { UserRoundPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RecommendationsCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRoundPlus className="h-4 w-4" />
          Что ещё стоит отслеживать
        </CardTitle>
        <CardDescription>Рекомендации для следующей итерации аналитики.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-muted-foreground">
        <p>1. Конверсия из запланированных в завершённые по дням недели и по мастерам.</p>
        <p>2. Среднее время до повторного визита по каждому клиенту.</p>
        <p>3. Причины отмен и неявок: источник и этап, на котором срывается запись.</p>
        <p>4. Прогноз загрузки на 7-14 дней вперёд по слотам.</p>
      </CardContent>
    </Card>
  );
}
