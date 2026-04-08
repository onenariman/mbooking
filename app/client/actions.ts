"use server";

import { redirect } from "next/navigation";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import { setOwnerSessionCookies } from "@/src/server/owner-session-cookies";

export async function activateClientInviteAndLogin(input: {
  token: string;
  email: string;
  password: string;
  confirm_password: string;
}) {
  const base = getNestServerBaseUrl();
  if (!base) {
    redirect(`/client/invite/${input.token}?error=nest-unconfigured`);
  }

  const act = await fetch(
    `${base}/v1/client/invitations/${encodeURIComponent(input.token)}/activate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        confirm_password: input.confirm_password,
      }),
    },
  );
  const actPayload = (await act.json().catch(() => ({}))) as { message?: string };
  if (!act.ok) {
    const m = encodeURIComponent(
      actPayload.message || act.statusText || "Ошибка активации",
    );
    redirect(`/client/invite/${input.token}?error=activate&message=${m}`);
  }

  const login = await fetch(`${base}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });
  const loginJson = (await login.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (!login.ok || !loginJson.accessToken || !loginJson.refreshToken) {
    redirect("/client/login?registered=after-invite");
  }

  const me = await fetch(`${base}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${loginJson.accessToken}` },
    cache: "no-store",
  });
  const meJson = (await me.json()) as { role?: string };
  if (meJson.role !== "client_portal") {
    redirect("/client/login?error=wrong-role");
  }

  await setOwnerSessionCookies(loginJson.accessToken, loginJson.refreshToken);
  redirect("/client");
}
