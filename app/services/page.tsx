import Service from "@/components/Service";
import { PageShell } from "@/components/layout/page-shell";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

const ServicesPage = async () => {
  await requireOwnerPageSession();
  return (
    <PageShell title="Услуги" description="Цены и привязка к категориям.">
      <Service />
    </PageShell>
  );
};

export default ServicesPage;
