import { redirect } from "next/navigation";
import { OwnerLoginCard } from "@/components/auth/OwnerLoginCard";
import { resolveSessionFromCookies } from "@/src/server/nest-session";

/** Тот же экран, что на `/` — отдельный URL для закладок и редиректов. */
export default async function LoginPage() {
  const session = await resolveSessionFromCookies("owner");
  if (session.payload?.role === "owner") {
    redirect("/receptions");
  }
  return <OwnerLoginCard />;
}
