import { redirect } from "next/navigation";
import { OwnerLoginCard } from "@/components/auth/OwnerLoginCard";
import { getNestAccessFromCookies } from "@/src/server/owner-session-cookies";

/**
 * Каноническая точка входа мастера: `/` — форма входа без редиректа на `/login`.
 * Сессия owner → сразу в приложение.
 */
export default async function Page() {
  const session = await getNestAccessFromCookies();
  if (session?.role === "owner") {
    redirect("/receptions");
  }
  return <OwnerLoginCard />;
}
