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
import { Skeleton } from "../ui/skeleton";

const ListClient = () => {
  const { data: clients = [], isLoading, isError, error } = useClients();

  if (isLoading) return <Skeleton className="w-full bg-gray-400 h-12" />;
  if (isError) return <p>Ошибка: {error?.message}</p>;

  return (
    <Command className="bg-transparent">
      <CommandInput placeholder="Найти клиента" />
      <CommandList className="min-h-fit">
        <CommandEmpty>Клиенты не найдены</CommandEmpty>
        <CommandGroup>
          {clients.map((client) => (
            <CommandItem
              key={client.id}
              value={`${client.name ?? ""} ${client.phone ?? ""}`}
              className="mt-3 w-full bg-background/70 rounded-4xl"
              variant="outline"
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
