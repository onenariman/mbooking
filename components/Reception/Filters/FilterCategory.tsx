"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCategories } from "@/src/hooks/categories.hooks";

interface FilterCategoryProps {
  value: string;
  onChange: (value: string) => void;
}

export function FilterCategory({ value, onChange }: FilterCategoryProps) {
  const { data: categories = [], isLoading, isError } = useCategories();

  if (isLoading) {
    return (
      <div className="flex gap-2 pb-2">
        <Spinner className="h-4 w-4" />
        <span className="text-xs text-muted-foreground">
          Загрузка категорий...
        </span>
      </div>
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
