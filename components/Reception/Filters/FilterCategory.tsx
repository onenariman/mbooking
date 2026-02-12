"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function FilterCategory({
  onChange,
}: {
  onChange: (value: "all" | "electro" | "cosmetology") => void;
}) {
  const categories = [
    { label: "Все услуги", value: "all" },
    { label: "Электроэпиляция", value: "electro" },
    { label: "Косметология", value: "cosmetology" },
  ];

  const [selected, setSelected] = useState("all");

  const handleClick = (value: any) => {
    setSelected(value);
    onChange(value);
  };

  return (
    <div className="flex gap-2 overflow-x-auto">
      {categories.map((c) => (
        <Button
          key={c.value}
          variant={selected === c.value ? "default" : "secondary"}
          onClick={() => handleClick(c.value)}
        >
          {c.label}
        </Button>
      ))}
    </div>
  );
}
