import Category from "@/components/Category";
import { PageShell } from "@/components/layout/page-shell";
import { requireOwnerPageSession } from "@/src/server/owner-page-guard";

const CategoriesPage = async () => {
  await requireOwnerPageSession();
  return (
    <PageShell title="Категории" description="Группы услуг для расписания и отчётов.">
      <Category />
    </PageShell>
  );
};

export default CategoriesPage;
