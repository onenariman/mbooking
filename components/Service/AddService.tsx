"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import Link from "next/link";
import { useCategories } from "@/src/hooks/categories.hooks";
import { useState } from "react";
import { useAddService } from "@/src/hooks/services.hook";
import { toast } from "sonner";
import Spinner from "../Spinner";
import { formatPriceInput } from "@/src/validators/formatPriceInput";

const AddService = () => {
  const { data: categories = [] } = useCategories();
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { mutate: addService, isPending } = useAddService();

  const handleSubmit = () => {
    if (!serviceName.trim()) {
      toast.error("Введите название услуги");
      return;
    }

    addService(
      {
        name: serviceName.trim(),
        category_id: categoryId,
        price: price,
      },
      {
        onSuccess: (data) => {
          setServiceName("");
          setPrice(null);
          setCategoryId(null);

          toast("Услуга добавлена", {
            description: `${data.name}`,
          });
        },
        onError: (error) => {
          toast.error("Услуга не добавлена", {
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
          <CardTitle>Добавить услугу</CardTitle>
          <CardDescription className="flex flex-col gap-y-2 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>
                Введите название услуги и выберите категорию. Если подходящей
                категории нет — выберите{" "}
                <span className="font-semibold">Без категории</span>.
              </li>
              <li>
                Категорию можно добавить на странице:{" "}
                <Link
                  href="/categories"
                  className="text-blue-600 hover:underline"
                >
                  Категории
                </Link>
              </li>
              <li className="text-xs text-gray-500 italic">
                *Рекомендуется всегда указывать категорию для статистики
              </li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-2">
          <Label>Название услуги</Label>
          <Input
            placeholder="Например: Электроэпиляция лица"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
          />
          <Label className="text-xs text-gray-500 italic">
            Внимание если *Стоимость услуги не фиксированная оставьте поле
            пустым
          </Label>
          <Input
            placeholder="Стоимость услуги"
            value={price ?? ""}
            onChange={(e) => {
              const formatted = formatPriceInput(e.target.value);

              // пустое поле
              if (formatted === "") {
                setPrice(null);
              } else {
                setPrice(Number(formatted.replace(/\s/g, "")));
              }
            }}
          />
          <Select
            key={categoryId ?? "empty"}
            value={categoryId ?? undefined}
            onValueChange={(value) =>
              setCategoryId(value === "" ? null : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Категории</SelectLabel>
                {categories.length > 0 &&
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.category_name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Spinner>Добавляем</Spinner> : "Добавить"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AddService;
