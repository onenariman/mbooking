"use server";

import { redirect } from "next/navigation";
import { postNestAuth } from "@/src/server/nest-auth-server";
import { setOwnerSessionCookies } from "@/src/server/owner-session-cookies";

export async function loginOwnerWithPassword(formData: FormData) {
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  const result = await postNestAuth("/v1/auth/login", { email, password });
  if (!result.ok) {
    if (result.status === 503) {
      redirect("/?error=nest-unconfigured");
    }
    redirect("/?error=auth-failed");
  }

  await setOwnerSessionCookies(result.accessToken, result.refreshToken);
  redirect("/receptions");
}
