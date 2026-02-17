"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { ZodService } from "@/src/schemas/services/serviceSchema";
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

interface SearchServiceProps {
  services: ZodService[];
  getService: (service: ZodService) => void;
}

const SearchService = ({ services, getService }: SearchServiceProps) => {
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedName ? selectedName : "Выберите услугу..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom" // Всегда открывать снизу
        sideOffset={4} // Небольшой отступ от кнопки
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder="Поиск услуги..." />
          <CommandList>
            <CommandEmpty>Услуга не найдена.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  key={service.id || service.name}
                  value={service.name ?? ""}
                  onSelect={(currentValue) => {
                    // Если нажали на уже выбранное — снимаем выбор, иначе выбираем новое
                    const newValue =
                      currentValue === selectedName ? "" : currentValue;
                    setSelectedName(newValue);

                    if (service) getService(service);
                    setOpen(false); // Закрываем выпадающий список
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedName === service.name
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {service.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchService;
