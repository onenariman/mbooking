"use server";

import { redirect } from "next/navigation";
import { postNestAuth } from "@/src/server/nest-auth-server";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import { setClientPortalSessionCookies } from "@/src/server/owner-session-cookies";

export async function clientPortalLogin(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  const result = await postNestAuth("/v1/auth/login", { email, password });
  if (!result.ok) {
    redirect("/client/login?error=auth-failed");
  }

  const base = getNestServerBaseUrl();
  if (!base) {
    redirect("/client/login?error=nest-unconfigured");
  }

  const me = await fetch(`${base}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${result.accessToken}` },
    cache: "no-store",
  });
  const user = (await me.json()) as { role?: string };
  if (user.role !== "client_portal") {
    redirect("/client/login?error=wrong-role");
  }

  await setClientPortalSessionCookies(result.accessToken, result.refreshToken);
  redirect("/client");
}
