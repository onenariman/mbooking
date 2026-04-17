import { type NextRequest } from "next/server";
import {
  verifyNestAccessToken,
  type NestAccessPayload,
} from "@/src/lib/owner-session";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import {
  getSessionCookieNames,
  type SessionKind,
  type SessionTokens,
} from "@/src/server/owner-session-cookies";

type RefreshPayload = {
  accessToken?: string;
  refreshToken?: string;
};

export type ResolvedSession = {
  accessToken: string | null;
  payload: NestAccessPayload | null;
  sessionUpdate?: SessionTokens;
  clearCookies?: boolean;
};

function splitCookieHeader(cookieHeader: string): Array<[string, string]> {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const idx = chunk.indexOf("=");
      return idx === -1 ? [chunk, ""] : [chunk.slice(0, idx), chunk.slice(idx + 1)];
    });
}

function updateCookieHeader(
  headers: Headers,
  cookieName: string,
  nextValue?: string,
): void {
  const entries = splitCookieHeader(headers.get("cookie") ?? "");
  const map = new Map(entries);

  if (nextValue === undefined) {
    map.delete(cookieName);
  } else {
    map.set(cookieName, nextValue);
  }

  const serialized = Array.from(map.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  if (serialized) {
    headers.set("cookie", serialized);
    return;
  }
  headers.delete("cookie");
}

export function applySessionTokensToRequestHeaders(
  headers: Headers,
  kind: SessionKind,
  tokens: SessionTokens,
): void {
  const config = getSessionCookieNames(kind);
  updateCookieHeader(headers, config.accessCookieName, tokens.accessToken);
  updateCookieHeader(headers, config.refreshCookieName, tokens.refreshToken);
}

export function clearSessionCookiesInRequestHeaders(
  headers: Headers,
  kind: SessionKind,
): void {
  const config = getSessionCookieNames(kind);
  updateCookieHeader(headers, config.accessCookieName);
  updateCookieHeader(headers, config.refreshCookieName);
}

export async function refreshNestSessionTokens(
  refreshToken?: string,
): Promise<SessionTokens | null> {
  if (!refreshToken) {
    return null;
  }

  const base = getNestServerBaseUrl();
  if (!base) {
    return null;
  }

  const response = await fetch(`${base}/v1/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as RefreshPayload;
  if (!response.ok || !payload.accessToken || !payload.refreshToken) {
    return null;
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

export async function resolveSessionFromRequest(
  request: NextRequest,
  kind: SessionKind,
): Promise<ResolvedSession> {
  const config = getSessionCookieNames(kind);
  const accessToken = request.cookies.get(config.accessCookieName)?.value;
  const payload = await verifyNestAccessToken(accessToken);
  if (payload && accessToken) {
    return { accessToken, payload };
  }

  const refreshToken = request.cookies.get(config.refreshCookieName)?.value;
  if (!refreshToken) {
    return { accessToken: null, payload: null };
  }

  const sessionUpdate = await refreshNestSessionTokens(refreshToken);
  if (!sessionUpdate) {
    return { accessToken: null, payload: null, clearCookies: true };
  }

  const refreshedPayload = await verifyNestAccessToken(sessionUpdate.accessToken);
  if (!refreshedPayload) {
    return { accessToken: null, payload: null, clearCookies: true };
  }

  return {
    accessToken: sessionUpdate.accessToken,
    payload: refreshedPayload,
    sessionUpdate,
  };
}
