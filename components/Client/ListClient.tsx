"use client";

import { useClients } from "@/src/hooks/clients.hooks";
import ItemClient from "./ItemClient";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";

const ListClient = () => {
  const { data: clients = [], isLoading, isError, error } = useClients();

  if (isLoading) return <p>Загрузка клиентов...</p>;
  if (isError) return <p>Ошибка: {error?.message}</p>;

  return (
    <Command>
      <CommandInput placeholder="Найти клиента" />
      <CommandList>
        <CommandEmpty>Клиенты не найдены</CommandEmpty>
        <CommandGroup>
          {clients.map((client) => (
            <CommandItem
              key={client.id}
              value={`${client.name ?? ""} ${client.phone ?? ""}`}
              className="border my-3"
            >
              <ItemClient client={client} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default ListClient;
