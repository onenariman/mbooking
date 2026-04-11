import ReceptionComponents from "@/components/Reception";
import { PageShell } from "@/components/layout/page-shell";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

const ReceptionPage = async () => {
  await requireOwnerPageSession();
  return (
    <PageShell
      title="Записи"
      description="Расписание, фильтры и действия по визитам."
    >
      <ReceptionComponents />
    </PageShell>
  );
};

export default ReceptionPage;
