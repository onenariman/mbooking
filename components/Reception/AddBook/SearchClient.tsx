"use client";
import { useClients } from "@/src/hooks/clients.hooks";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { UserSearch } from "lucide-react";

export default function SearchClient() {
  const { data: clients = [] } = useClients();

  return (
    <Combobox items={clients}>
      <ComboboxInput placeholder="Выбрать клиента" showClear>
        <InputGroupAddon>
          <UserSearch className="h-4 w-4" />
        </InputGroupAddon>
      </ComboboxInput>

      {/* Контейнер с ограниченной высотой и скроллом */}
      <div className="max-h-60 overflow-y-auto">
        <ComboboxContent>
          <ComboboxEmpty>Клиент не найден</ComboboxEmpty>
          <ComboboxList>
            {(client) => (
              <ComboboxItem key={client} value={client}>
                {client}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </div>
    </Combobox>
  );
}
