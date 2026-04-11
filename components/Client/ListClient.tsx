"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useClients } from "@/src/hooks/clients.hooks";
import ItemClient from "./ItemClient";
import { Input } from "@/components/ui/input";
import { Skeleton } from "../ui/skeleton";

const ListClient = () => {
  const { data: clients = [], isLoading, isError, error } = useClients();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return clients;
    const qDigits = q.replace(/\D/g, "");
    return clients.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const phone = (c.phone ?? "").replace(/\D/g, "");
      return name.includes(q) || (qDigits.length > 0 && phone.includes(qDigits));
    });
  }, [clients, q]);

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[4.25rem] w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {error?.message ?? "Не удалось загрузить клиентов"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Имя или телефон"
          className="h-11 rounded-xl border-border/80 bg-muted/25 pl-10 pr-4 text-base shadow-sm transition-shadow focus-visible:bg-background focus-visible:shadow-md md:h-10 md:text-sm"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="size-7 opacity-90" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-medium text-foreground">
            {clients.length === 0 ? "Пока нет клиентов" : "Никого не нашли"}
          </p>
          <p className="max-w-[260px] text-xs leading-relaxed text-muted-foreground">
            {clients.length === 0
              ? "Добавьте клиента кнопкой выше — он появится в этом списке."
              : "Измените запрос или сбросьте поиск."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5" role="list">
          {filtered.map((client) => (
            <li key={client.id}>
              <ItemClient client={client} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ListClient;
