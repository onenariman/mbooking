"use client";
import { useState } from "react";
import { toast } from "sonner";
import Spinner from "../Spinner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import Link from "next/link";
import { useAddCategory } from "@/src/hooks/categories.hooks";
import { formatNameInput } from "@/src/validators/formatNameInput";

const AddCategory = () => {
  const [categoryName, setCategoryName] = useState("");
  const { mutate: addCategory, isPending } = useAddCategory();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryName(formatNameInput(e.target.value));
  };

  const handleSubmit = () => {
    if (!categoryName.trim()) {
      toast.error("Введите имя клиента");
      return;
    }

    addCategory(
      {
        category_name: categoryName.trim(),
      },
      {
        onSuccess: (data) => {
          setCategoryName("");

          toast("Категория добавлена", {
            description: `${data.category_name}`,
          });
        },
        onError: (error) => {
          toast.error("Категория не добавлена", {
            description: `Проверьте соединение с интернетом: ${error.message}`,
          });
        },
      },
    );
  };

  return (
    <>
      <Card className="border-none">
        <CardHeader>
          <CardTitle>Добавить категорию</CardTitle>
          <CardDescription className="flex flex-col gap-y-2 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Введите название категрию. Позже вы сможете использовать
                категорию в добавлении услуги
              </li>
              <li>
                Услугу можно добавить на этой странице:{" "}
                <Link
                  href="/services"
                  className="text-blue-600 hover:underline"
                >
                  Услуги
                </Link>
              </li>
              <li className="text-xs text-gray-500 italic">
                *Рекомендуется всегда добавлять категорию для услуги
              </li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-2">
          <Label>Название категории</Label>
          <Input
            placeholder="Например: Косметология"
            value={categoryName}
            onChange={handleNameChange}
            suppressHydrationWarning
          />
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Spinner>Добавляем</Spinner> : "Добавить"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AddCategory;
