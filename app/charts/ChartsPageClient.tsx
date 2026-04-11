"use client";

import ChartsSection from "@/components/Charts";
import { PageShell } from "@/components/layout/page-shell";

export default function ChartsPageClient() {
  return (
    <PageShell
      title="Статистика"
      description="Записи, клиентская база и выручка за выбранный период."
    >
      <ChartsSection />
    </PageShell>
  );
}
