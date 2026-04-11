"use server";

import { redirect } from "next/navigation";
import { postNestAuth } from "@/src/server/nest-auth-server";
import { getOwnerRegistrationEnabled } from "@/src/server/nest-session";
import { setOwnerSessionCookies } from "@/src/server/owner-session-cookies";

export async function registerOwner(formData: FormData) {
  if (!getOwnerRegistrationEnabled()) {
    redirect("/?error=registration-disabled");
  }

  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("password_confirm") as string;

  if (password !== passwordConfirm) {
    redirect("/register?error=password-mismatch");
  }
  if (password.length < 8) {
    redirect("/register?error=password-short");
  }

  const result = await postNestAuth("/v1/auth/register", { email, password });
  if (!result.ok) {
    if (result.status === 503) {
      redirect("/register?error=nest-unconfigured");
    }
    if (result.status === 403) {
      redirect("/register?error=registration-disabled");
    }
    if (result.status === 409) {
      redirect("/register?error=email-taken");
    }
    redirect(
      `/register?error=signup-failed&message=${encodeURIComponent(result.message)}`,
    );
  }

  await setOwnerSessionCookies(result.accessToken, result.refreshToken);
  redirect("/");
}
