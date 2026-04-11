import { redirect } from "next/navigation";
import { resolveSessionFromCookies } from "@/src/server/nest-session";

export async function requireOwnerPageSession(): Promise<void> {
  const ownerSession = await resolveSessionFromCookies("owner");
  if (ownerSession.payload?.role === "owner") {
    return;
  }

  const clientSession = await resolveSessionFromCookies("client_portal");
  if (clientSession.payload?.role === "client_portal") {
    redirect("/client");
  }

  redirect("/");
}
