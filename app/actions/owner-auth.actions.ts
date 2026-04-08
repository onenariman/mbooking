"use server";

import { OWNER_REFRESH_COOKIE } from "@/src/lib/owner-session";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import {
  clearOwnerSessionCookies,
  setOwnerSessionCookies,
} from "@/src/server/owner-session-cookies";
import { cookies } from "next/headers";

export async function ownerLogout(): Promise<void> {
  const jar = await cookies();
  const refresh = jar.get(OWNER_REFRESH_COOKIE)?.value;
  await clearOwnerSessionCookies();

  const base = getNestServerBaseUrl();
  if (base && refresh) {
    try {
      await fetch(`${base}/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch {
      /* ignore */
    }
  }
}

export async function setOwnerSessionFromNestTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await setOwnerSessionCookies(accessToken, refreshToken);
}

export async function refreshOwnerSessionFromCookies(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const jar = await cookies();
  const refresh = jar.get(OWNER_REFRESH_COOKIE)?.value;
  if (!refresh) {
    return { ok: false, message: "Нет refresh-сессии в cookie" };
  }
  const base = getNestServerBaseUrl();
  if (!base) {
    return { ok: false, message: "Nest не настроен" };
  }
  const res = await fetch(`${base}/v1/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    accessToken?: string;
    refreshToken?: string;
    message?: unknown;
  };
  if (!res.ok || !json.accessToken || !json.refreshToken) {
    const msg =
      typeof json.message === "string"
        ? json.message
        : "Не удалось обновить сессию";
    return { ok: false, message: msg };
  }
  await setOwnerSessionCookies(json.accessToken, json.refreshToken);
  return { ok: true };
}
