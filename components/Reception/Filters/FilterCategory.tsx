"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/src/hooks/categories.hooks";

interface FilterCategoryProps {
  value: string;
  onChange: (value: string) => void;
}

export function FilterCategory({ value, onChange }: FilterCategoryProps) {
  const { data: categories = [], isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <Button disabled className="bg-transparent w-full">
        <Skeleton className="h-8 w-full rounded-full bg-gray-200/80" />
      </Button>
    );
  }

  if (isError) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* Кнопка "Все" всегда первая */}
      <Button
        type="button"
        size="sm"
        variant={value === "all" ? "default" : "secondary"}
        onClick={() => onChange("all")}
        className="whitespace-nowrap rounded-full"
      >
        Все услуги
      </Button>

      {/* Динамические категории из базы */}
      {categories.map((category) => (
        <Button
          key={category.id}
          type="button"
          size="sm"
          variant={value === category.category_name ? "default" : "secondary"}
          onClick={() => onChange(category.category_name)}
          className="whitespace-nowrap rounded-full"
        >
          {category.category_name}
        </Button>
      ))}
    </div>
  );
}
