"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useCreateRecommendationPrompt,
  useDeleteRecommendationPrompt,
  useRecommendationPrompts,
  useUpdateRecommendationPrompt,
} from "@/src/hooks/recommendationPrompts.hooks";
import { getErrorMessage } from "@/src/helpers/getErrorMessage";
import DeleteConfirmButton from "./DeleteConfirmButton";
import RecommendationsBreadcrumb from "./RecommendationsBreadcrumb";

const MAX_PROMPT_LEN = 8000;
const PREVIEW_LIMIT = 220;

export default function PromptsSection() {
  const { data: prompts = [], isLoading } = useRecommendationPrompts();
  const { mutateAsync: createPrompt, isPending: isCreating } =
    useCreateRecommendationPrompt();
  const { mutateAsync: updatePrompt, isPending: isUpdating } =
    useUpdateRecommendationPrompt();
  const { mutateAsync: deletePrompt, isPending: isDeleting } =
    useDeleteRecommendationPrompt();

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingDefault, setEditingDefault] = useState(false);
  const [openItems, setOpenItems] = useState<string[]>([]);

  const isBusy = isCreating || isUpdating || isDeleting;

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) {
      toast.error("Заполните название и текст промта");
      return;
    }

    try {
      await createPrompt({
        name: name.trim(),
        content: content.trim(),
        is_default: makeDefault,
      });
      setName("");
      setContent("");
      setMakeDefault(false);
      toast.success("Промпт создан");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка создания промта"));
    }
  };

  const startEdit = (promptId: string) => {
    const prompt = prompts.find((item) => item.id === promptId);
    if (!prompt) {
      return;
    }
    setEditingId(prompt.id);
    setEditingName(prompt.name);
    setEditingContent(prompt.content);
    setEditingDefault(prompt.is_default);
    setOpenItems((prev) => (prev.includes(prompt.id) ? prev : [...prev, prompt.id]));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingContent("");
    setEditingDefault(false);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editingName.trim() || !editingContent.trim()) {
      toast.error("Заполните название и текст промта");
      return;
    }

    try {
      await updatePrompt({
        id: editingId,
        input: {
          name: editingName.trim(),
          content: editingContent.trim(),
          is_default: editingDefault,
        },
      });
      toast.success("Промпт обновлён");
      cancelEdit();
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка обновления промта"));
    }
  };

  const handleSetDefault = async (promptId: string) => {
    try {
      await updatePrompt({ id: promptId, input: { is_default: true } });
      toast.success("Промпт назначен основным");
    } catch (error) {
      toast.error(getErrorMessage(error, "Ошибка обновления промта"));
    }
  };

  const handleDelete = async (promptId: string) => {
    await deletePrompt(promptId);
  };

  const promptHelp = useMemo(
    () =>
      "Можно использовать {{context}}, чтобы вставить данные. Если не использовать, контекст добавится в конец.",
    [],
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <RecommendationsBreadcrumb current="Промты" />

      <Card>
        <CardHeader>
          <CardTitle>Новый промпт</CardTitle>
          <CardDescription>
            Создайте собственный промпт для генерации рекомендаций.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Label>Название</Label>
          <Input
            placeholder="Например: Фокус на удержание"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Label>Текст промта</Label>
          <Textarea
            placeholder="Введите текст промта. {{context}} вставит отзывы и метаданные."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_PROMPT_LEN}
            rows={6}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{promptHelp}</span>
            <span>
              {content.length}/{MAX_PROMPT_LEN}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={makeDefault}
              onCheckedChange={setMakeDefault}
              id="make-default"
            />
            <Label htmlFor="make-default" className="text-sm">
              Сделать основным
            </Label>
          </div>
          <Button onClick={handleCreate} disabled={isBusy}>
            Создать промпт
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ваши промты</CardTitle>
          <CardDescription>
            Редактируйте и выбирайте основной промпт.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Загружаем промты...
            </div>
          ) : prompts.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Пока нет промтов. Создайте первый.
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={openItems}
              onValueChange={setOpenItems}
              className="border-0 rounded-none"
            >
              {prompts.map((prompt) => {
                const isEditing = editingId === prompt.id;
                const preview =
                  prompt.content.length > PREVIEW_LIMIT
                    ? `${prompt.content.slice(0, PREVIEW_LIMIT)}…`
                    : prompt.content;

                return (
                  <AccordionItem
                    key={prompt.id}
                    value={prompt.id}
                    className="border rounded-2xl mb-3 last:mb-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 px-2">
                      <AccordionTrigger className="flex-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">
                              {prompt.name}
                            </span>
                            {prompt.is_default ? <Badge>Основной</Badge> : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {preview}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <div className="flex flex-wrap gap-2 px-2 pt-2">
                        {prompt.is_default ? null : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(prompt.id)}
                            disabled={isBusy}
                          >
                            Сделать основным
                          </Button>
                        )}
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleUpdate}
                              disabled={isBusy}
                            >
                              Сохранить
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={isBusy}
                            >
                              Отмена
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(prompt.id)}
                            disabled={isBusy}
                          >
                            Редактировать
                          </Button>
                        )}
                        <DeleteConfirmButton
                          title="Удалить промпт?"
                          description="Это действие нельзя отменить. Промпт будет удален из списка."
                          onDelete={() => handleDelete(prompt.id)}
                          successMessage="Промпт удален"
                          errorMessage="Ошибка удаления промта"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={isBusy}
                          >
                            Удалить
                          </Button>
                        </DeleteConfirmButton>
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <AccordionContent>
                      {isEditing ? (
                        <div className="flex flex-col gap-3">
                          <Label>Название</Label>
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                          <Label>Текст промта</Label>
                          <Textarea
                            value={editingContent}
                            onChange={(event) =>
                              setEditingContent(event.target.value)
                            }
                            maxLength={MAX_PROMPT_LEN}
                            rows={6}
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{promptHelp}</span>
                            <span>
                              {editingContent.length}/{MAX_PROMPT_LEN}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={editingDefault}
                              onCheckedChange={setEditingDefault}
                              id={`default-${prompt.id}`}
                            />
                            <Label htmlFor={`default-${prompt.id}`} className="text-sm">
                              Сделать основным
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {prompt.content}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
