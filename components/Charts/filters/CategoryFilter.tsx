"use client";

import { Button } from "@/components/ui/button";

type CategoryFilterProps = {
  categoryOptions: string[];
  activeCategory: string;
  onChange: (category: string) => void;
};

export default function CategoryFilter({
  categoryOptions,
  activeCategory,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categoryOptions.map((category) => {
        const isActive = activeCategory === category;
        const label = category === "all" ? "Все категории" : category;

        return (
          <Button
            key={category}
            size="sm"
            type="button"
            variant={isActive ? "default" : "secondary"}
            className="whitespace-nowrap rounded-full"
            onClick={() => onChange(category)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
