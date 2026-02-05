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

const AddService = () => {
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
                Категорию можно добавить на этой странице:{" "}
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
          <Input placeholder="Например: Электроэпиляция лица" />
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Категории</SelectLabel>
                <SelectItem value=" ">Без категории</SelectItem>
                <SelectItem value="epilation">Электроэпиляция</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button>Добавить услугу</Button>
        </CardContent>
      </Card>
    </>
  );
};

export default AddService;
