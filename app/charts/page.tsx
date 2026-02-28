"use client";

import ChartsSection from "@/components/Charts";

export default function ChartsPage() {
  return (
    <div className="flex min-h-screen flex-col gap-y-5 py-4">
      <div>
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className="text-sm text-muted-foreground">
          Анализ записей, клиентской базы и выручки за выбранный период.
        </p>
      </div>
      <ChartsSection />
    </div>
  );
}
