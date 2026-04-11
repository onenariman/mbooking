import { redirect } from "next/navigation";
import { OwnerLoginCard } from "@/components/auth/OwnerLoginCard";
import { resolveSessionFromCookies } from "@/src/server/nest-session";

/**
 * Каноническая точка входа мастера: `/` — форма входа без редиректа на `/login`.
 * Сессия owner → сразу в приложение.
 */
export default async function Page() {
  const session = await resolveSessionFromCookies("owner");
  if (session.payload?.role === "owner") {
    redirect("/receptions");
  }
  return <OwnerLoginCard />;
}
