"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { ZodClient } from "@/src/schemas/clients/clientSchema";
import { cn } from "@/src/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchClientProps {
  clients: ZodClient[];
  getClient: (client: ZodClient) => void;
}

export default function SearchClient({ clients, getClient }: SearchClientProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const selectedClient = clients.find((client) => client.id === selectedClientId);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient ? selectedClient.name : "Выберите клиента..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-2"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder="Поиск клиента..." />
          <CommandList className="border-none">
            <CommandEmpty>Клиент не найден.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  className="mt-2"
                  key={client.id}
                  value={`${client.name} ${client.phone}`}
                  onSelect={() => {
                    setSelectedClientId(client.id);
                    getClient(client);
                    setOpen(false);
                  }}
                >
                  {client.name}
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedClientId === client.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

