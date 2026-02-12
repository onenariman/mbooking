"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function FilterStatus({
  onChange,
}: {
  onChange: (value: "all" | "pending" | "confirmed" | "cancelled") => void;
}) {
  const statuses = [
    { label: "Все", value: "all" },
    { label: "Ожидает", value: "pending" },
    { label: "Подтверждено", value: "confirmed" },
    { label: "Отменено", value: "cancelled" },
  ];

  const [selected, setSelected] = useState("all");

  const handleClick = (value: any) => {
    setSelected(value);
    onChange(value);
  };

  return (
    <div className="flex gap-2 overflow-x-auto">
      {statuses.map((s) => (
        <Button
          key={s.value}
          variant={selected === s.value ? "default" : "secondary"}
          onClick={() => handleClick(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
