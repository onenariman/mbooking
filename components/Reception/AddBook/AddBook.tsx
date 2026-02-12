"use client";

import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SearchClient from "./SearchClient";
import SearchService from "./SearchService";
import DateBook from "./DateBook";

export default function AddBookDiv() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Добавить запись
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />

          {/* Контент */}
          <div className="fixed top-0 inset-x-0 z-50 mx-auto mt-0 w-full max-w-5xl rounded-b-lg bg-white shadow-lg overflow-hidden animate-slide-in-from-top h-fit flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b flex flex-col justify-between items-start">
              <h2 className="text-lg font-semibold">Новая запись</h2>
              <p className="text-sm text-gray-500">
                Обязательно заполните все поля и проверьте правильность перед
                сохранением.
              </p>
            </div>

            {/* Основной контент */}
            <div className="px-5 py-3 flex flex-col gap-2">
              <SearchClient />
              <SearchService />
              <DateBook />
              <Textarea placeholder="Свободный комментарий (Не обязательное поле) " />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <Button type="submit">Сохранить</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Выйти
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
