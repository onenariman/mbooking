"use client";

import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import ItemCategory from "./ItemCategory";
import { useCategories } from "@/src/hooks/categories.hooks";

const ListCategory = () => {
  const { data: categories = [], isLoading, isError, error } = useCategories();

  if (isLoading) return <p>Загрузка катеогрий...</p>;
  if (isError) return <p>Ошибка: {error?.message}</p>;

  return (
    <Command>
      <CommandInput placeholder="Найти категорию" />

      <CommandList className="my-5">
        <CommandEmpty>Категории не найдены</CommandEmpty>

        <CommandGroup>
          {categories.map((category) => (
            <CommandItem
              key={category.id}
              value={category.category_name}
              className="border my-3"
            >
              <ItemCategory category={category} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default ListCategory;
