"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react"; // Импортируйте иконки
import { ZodClient } from "@/src/schemas/clients/clientSchema";
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
import { cn } from "@/src/lib/utils";

interface SearchClientProps {
  clients: ZodClient[];
  getClient: (client: ZodClient) => void;
}

export default function SearchClient({
  clients,
  getClient,
}: SearchClientProps) {
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      {/* 1. modal={true} критически важен внутри Drawer/Sheet, 
         чтобы фокус не "улетал" и работал скролл.
      */}

      <PopoverTrigger asChild>
        {/* asChild предотвращает вложенность button в button */}
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedName ? selectedName : "Выберите клиента..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* Внутри Drawer на мобильных PopoverContent может вылезать за пределы.
         className="w-[--radix-popover-trigger-width]" заставит его быть шириной с кнопку.
      */}
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom" // Всегда открывать снизу
        sideOffset={4} // Небольшой отступ от кнопки
        avoidCollisions={false}
      >
        <Command>
          {/* Input теперь внутри контента, а не внутри кнопки-триггера */}
          <CommandInput placeholder="Поиск клиента..." />
          <CommandList>
            <CommandEmpty>Клиент не найден.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id || client.name} // Лучше использовать ID если есть
                  value={client.name ?? ""}
                  onSelect={(currentValue) => {
                    // Логика выбора:
                    setSelectedName(
                      currentValue === selectedName ? "" : currentValue,
                    );
                    if (client) getClient(client);
                    setOpen(false); // Закрываем после выбора
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedName === client.name
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
