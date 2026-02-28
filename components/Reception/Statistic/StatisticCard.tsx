"use client";

import { useMemo } from "react";
import { ChartLine } from "lucide-react";
import { useAppointments } from "@/src/hooks/appointments.hooks";
import { startOfLocalDayUtcRange } from "@/src/lib/time";
import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";

const StatisticCard = () => {
  const todayRange = useMemo(() => startOfLocalDayUtcRange(new Date()), []);
  const { data: appointments = [], isLoading } = useAppointments(todayRange);

  const stats = useMemo(() => {
    const categoriesMap: Record<string, number> = {};

    for (const appointment of appointments) {
      if (appointment.status !== "completed" || !appointment.amount) {
        continue;
      }

      const categoryName = appointment.category_name || "Без категории";
      categoriesMap[categoryName] =
        (categoriesMap[categoryName] || 0) + appointment.amount;
    }

    return Object.entries(categoriesMap).map(([title, sum]) => ({
      title,
      description: `${sum.toLocaleString("ru-RU")} руб. / Сегодня`,
    }));
  }, [appointments]);

  if (isLoading) {
    return (
      <Button className="bg-transparent w-full">
        <Skeleton className="h-8 w-full rounded-full bg-gray-200/80" />
      </Button>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border p-4 text-center">
        Сегодня ещё нет завершённых процедур
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex flex-col items-center gap-y-5">
        <Carousel className="w-full">
          <CarouselContent>
            {stats.map((item) => (
              <CarouselItem key={item.title}>
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
