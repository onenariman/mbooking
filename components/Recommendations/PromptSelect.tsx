"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ZodRecommendationPrompt } from "@/src/schemas/feedback/feedbackSchema";

type PromptSelectProps = {
  prompts: ZodRecommendationPrompt[];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
};

export default function PromptSelect({
  prompts,
  value,
  onChange,
  isLoading,
}: PromptSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Выбрать промпт:</span>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="Выберите промпт" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Промпты</SelectLabel>
            <SelectItem value="system">По умолчанию</SelectItem>
            {prompts.map((prompt) => (
              <SelectItem key={prompt.id} value={prompt.id}>
                {prompt.name}
                {prompt.is_default ? " (основной)" : ""}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
