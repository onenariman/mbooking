"use client";

import { useMemo } from "react";
import { useAppointments } from "@/src/hooks/appointments.hooks";
import { startOfDay, endOfDay } from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { ChartLine } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const StatisticCard = () => {
  // Получаем данные за сегодня (можно прокинуть даты из родителя, если нужно за весь период)
  const today = useMemo(
    () => ({
      from: startOfDay(new Date()).toISOString(),
      to: endOfDay(new Date()).toISOString(),
    }),
    [],
  );

  const { data: appointments = [], isLoading } = useAppointments(today);

  // Считаем суммы по категориям динамически
  const stats = useMemo(() => {
    const categoriesMap: Record<string, number> = {};

    appointments.forEach((app) => {
      // Считаем только завершенные записи, у которых есть сумма
      if (app.status === "completed" && app.amount) {
        const cat = app.category_name || "Без категории";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + app.amount;
      }
    });

    return Object.entries(categoriesMap).map(([title, sum]) => ({
      title,
      description: `${sum.toLocaleString("ru-RU")} руб. / Сегодня`,
    }));
  }, [appointments]);

  if (isLoading)
    return (
      <div className="flex justify-center p-4">
        <Spinner />
      </div>
    );

  // Если за сегодня еще нет завершенных записей
  if (stats.length === 0) {
    return (
      <div className="p-4 text-center border rounded-xl text-muted-foreground text-sm">
        Сегодня еще нет завершенных процедур
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col mx-auto gap-y-5 items-center">
        <Carousel className="w-full">
          <CarouselContent>
            {stats.map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Item variant="outline">
                    <ItemContent>
                      <ItemTitle className="text-sm font-medium">
                        {item.title}
                      </ItemTitle>
                      <ItemDescription className="text-lg font-bold text-foreground">
                        {item.description}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full shadow-sm"
                      >
                        <ChartLine
                          strokeWidth={1.5}
                          size={20}
                          className="text-primary"
                        />
                      </Button>
                    </ItemActions>
                  </Item>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {stats.length > 1 && (
            <>
              <CarouselPrevious className="-left-4" />
              <CarouselNext className="-right-4" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
};

export default StatisticCard;
