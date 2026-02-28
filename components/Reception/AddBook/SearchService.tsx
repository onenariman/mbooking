"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { ZodService } from "@/src/schemas/services/serviceSchema";
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

interface SearchServiceProps {
  services: ZodService[];
  getService: (service: ZodService) => void;
}

const SearchService = ({ services, getService }: SearchServiceProps) => {
  const [open, setOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const selectedService = services.find((service) => service.id === selectedServiceId);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedService ? selectedService.name : "Выберите услугу..."}
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
          <CommandInput placeholder="Поиск услуги..." />
          <CommandList className="border-none">
            <CommandEmpty>Услуга не найдена.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  className="mt-2"
                  key={service.id}
                  value={service.name}
                  onSelect={() => {
                    setSelectedServiceId(service.id);
                    getService(service);
                    setOpen(false);
                  }}
                >
                  {service.name}
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedServiceId === service.id ? "opacity-100" : "opacity-0",
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
};

export default SearchService;

