"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecommendationPromptFilterOption } from "./types";

type ListPromptFilterProps = {
  value: string;
  onChange: (value: string) => void;
  options: RecommendationPromptFilterOption[];
  disabled?: boolean;
};

export default function ListPromptFilter({
  value,
  onChange,
  options,
  disabled,
}: ListPromptFilterProps) {
  return (
    <div className="flex-none">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[220px] sm:w-[260px]">
          <SelectValue placeholder="Все промпты" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
