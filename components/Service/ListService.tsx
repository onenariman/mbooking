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

const ListService = () => {
  const { data: services = [], isLoading, isError, error } = useServices();
  if (isLoading) return <p>Загрузка услуг...</p>;
  if (isError) return <p>Ошибка: {error?.message}</p>;
  return (
    <>
      <Command>
        <CommandInput placeholder="Найти услугу" />

        <CommandList className="my-5">
          <CommandEmpty>Услуги не найдены</CommandEmpty>

          <CommandGroup>
            {services.map((service) => (
              <CommandItem
                key={service.id}
                value={`${service.name ?? ""}`}
                className="border my-3"
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
