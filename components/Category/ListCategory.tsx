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
import { Skeleton } from "../ui/skeleton";

const ListCategory = () => {
  const { data: categories = [], isLoading, isError, error } = useCategories();

  if (isLoading) return <Skeleton className="w-full bg-gray-400 h-12" />;
  if (isError) return <p>Ошибка: {error?.message}</p>;

  return (
    <Command className="bg-transparent">
      <CommandInput placeholder="Найти категорию" />
      <CommandList className="min-h-fit">
        <CommandEmpty>Категории не найдены</CommandEmpty>
        <CommandGroup>
          {categories.map((category) => (
            <CommandItem
              variant="outline"
              key={category.id}
              value={category.category_name}
              className="mt-3 w-full bg-background/70 rounded-4xl"
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
