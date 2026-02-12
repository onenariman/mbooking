"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { useServices } from "@/src/hooks/services.hook";
import { TextSearch } from "lucide-react";

const SearchService = () => {
  const { data: services = [] } = useServices();
  return (
    <Combobox items={services}>
      <ComboboxInput placeholder="Выбрать услугу" showClear>
        <InputGroupAddon>
          <TextSearch className="h-4 w-4" />
        </InputGroupAddon>
      </ComboboxInput>

      <ComboboxContent>
        <ComboboxEmpty>Услуга не найдена</ComboboxEmpty>

        <ComboboxList>
          {(group, index) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>

              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>

              {index < services.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

export default SearchService;
