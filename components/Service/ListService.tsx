"use client";

import { useServices } from "@/src/hooks/services.hook";
import ItemService from "./ItemService";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Skeleton } from "../ui/skeleton";

const ListService = () => {
  const { data: services = [], isLoading, isError, error } = useServices();
  if (isLoading) return <Skeleton className="w-full bg-gray-400 h-12" />;
  if (isError) return <p>Ошибка: {error?.message}</p>;
  return (
    <>
      <Command className="bg-transparent">
        <CommandInput placeholder="Найти услугу" />
        <CommandList className="min-h-fit">
          <CommandEmpty>Услуги не найдены</CommandEmpty>
          <CommandGroup>
            {services.map((service) => (
              <CommandItem
                key={service.id}
                value={`${service.name ?? ""}`}
                className="mt-3 w-full bg-background/70 rounded-4xl"
                variant="outline"
              >
                <ItemService service={service} />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </>
  );
};

export default ListService;
