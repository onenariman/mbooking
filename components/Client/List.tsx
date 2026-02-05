"use client";

import { useClients } from "@/src/hooks/clients.hooks";
import Item from "./Item";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

const List = () => {
  const { data: clients = [], isLoading, isError, error } = useClients();

  if (isLoading) return <p>Загрузка клиентов...</p>;
  if (isError) return <p>Ошибка: {error?.message}</p>;

  return (
    <Command>
      <CommandInput placeholder="Найти клиента" />

      <CommandList className="my-5">
        <CommandEmpty>Клиенты не найдены</CommandEmpty>

        <CommandGroup>
          {clients.map((client) => (
            <CommandItem
              key={client.id}
              value={`${client.name ?? ""} ${client.phone ?? ""}`}
              className="border my-3"
            >
              <Item client={client} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default List;
