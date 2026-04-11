"use client";

import Client from "@/components/Client";
import { PageShell } from "@/components/layout/page-shell";

export default function ClientsPageClient() {
  return (
    <PageShell title="Клиенты" description="Поиск по имени и телефону, контакты и скидки.">
      <Client />
    </PageShell>
  );
}
