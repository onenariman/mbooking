import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChartLine } from "lucide-react";

const StatisticCard = () => {
  const carouselItems = [
    {
      title: "Электроэпиляция",
      description: "4790 руб. / Сегодня",
    },
    {
      title: "Косметология",
      description: "12790 руб. / Сегодня",
    },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col mx-auto gap-y-5 items-center">
        <Carousel className="max-w-9/12 lg:min-w-full">
          <CarouselContent>
            {carouselItems.map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Item variant="outline">
                    <ItemContent>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemDescription>{item.description}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="destructive"
                        size="default"
                        className="cursor-pointer"
                      >
                        <ChartLine strokeWidth={1.5} size={24} />
                      </Button>
                    </ItemActions>
                  </Item>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default StatisticCard;
