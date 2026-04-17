"use client";

import { PageShell } from "@/components/layout/page-shell";
import { OwnerOrganizationForm } from "@/components/OwnerOrganization/OwnerOrganizationForm";

export default function OrganizationPageClient() {
  return (
    <PageShell
      title="Организация"
      description="Контакты и реквизиты. Email для входа меняется через Яндекс ID."
    >
      <OwnerOrganizationForm />
    </PageShell>
  );
}

