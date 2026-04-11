import { cookies } from "next/headers";
import { type NextResponse } from "next/server";
import {
  CLIENT_PORTAL_ACCESS_COOKIE,
  CLIENT_PORTAL_ACCESS_COOKIE_MAX_AGE,
  CLIENT_PORTAL_REFRESH_COOKIE,
  CLIENT_PORTAL_REFRESH_COOKIE_MAX_AGE,
  OWNER_ACCESS_COOKIE,
  OWNER_ACCESS_COOKIE_MAX_AGE,
  OWNER_REFRESH_COOKIE,
  OWNER_REFRESH_COOKIE_MAX_AGE,
  verifyNestAccessToken,
  type NestAccessPayload,
} from "@/src/lib/owner-session";

export type SessionKind = "owner" | "client_portal";
export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

const cookieBase = () => ({
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
});

export function getSessionCookieNames(kind: SessionKind) {
  return kind === "owner"
    ? {
        accessCookieName: OWNER_ACCESS_COOKIE,
        refreshCookieName: OWNER_REFRESH_COOKIE,
        accessMaxAge: OWNER_ACCESS_COOKIE_MAX_AGE,
        refreshMaxAge: OWNER_REFRESH_COOKIE_MAX_AGE,
      }
    : {
        accessCookieName: CLIENT_PORTAL_ACCESS_COOKIE,
        refreshCookieName: CLIENT_PORTAL_REFRESH_COOKIE,
        accessMaxAge: CLIENT_PORTAL_ACCESS_COOKIE_MAX_AGE,
        refreshMaxAge: CLIENT_PORTAL_REFRESH_COOKIE_MAX_AGE,
      };
}

export function applySessionCookiesToResponse(
  response: NextResponse,
  kind: SessionKind,
  tokens: SessionTokens,
): void {
  const base = cookieBase();
  const config = getSessionCookieNames(kind);
  response.cookies.set(config.accessCookieName, tokens.accessToken, {
    ...base,
    maxAge: config.accessMaxAge,
  });
  response.cookies.set(config.refreshCookieName, tokens.refreshToken, {
    ...base,
    maxAge: config.refreshMaxAge,
  });
}

export function clearSessionCookiesOnResponse(
  response: NextResponse,
  kind: SessionKind,
): void {
  const config = getSessionCookieNames(kind);
  response.cookies.delete(config.accessCookieName);
  response.cookies.delete(config.refreshCookieName);
}

export async function setOwnerSessionCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const jar = await cookies();
  const base = cookieBase();
  jar.set(OWNER_ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: OWNER_ACCESS_COOKIE_MAX_AGE,
  });
  jar.set(OWNER_REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: OWNER_REFRESH_COOKIE_MAX_AGE,
  });
}

export async function clearOwnerSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(OWNER_ACCESS_COOKIE);
  jar.delete(OWNER_REFRESH_COOKIE);
}

export async function setClientPortalSessionCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const jar = await cookies();
  const base = cookieBase();
  jar.set(CLIENT_PORTAL_ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: CLIENT_PORTAL_ACCESS_COOKIE_MAX_AGE,
  });
  jar.set(CLIENT_PORTAL_REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: CLIENT_PORTAL_REFRESH_COOKIE_MAX_AGE,
  });
}

export async function clearClientPortalSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(CLIENT_PORTAL_ACCESS_COOKIE);
  jar.delete(CLIENT_PORTAL_REFRESH_COOKIE);
}

/** Для Server Components / actions: тот же JWT, что проверяет middleware. */
export async function getNestAccessFromCookies(): Promise<NestAccessPayload | null> {
  const jar = await cookies();
  return verifyNestAccessToken(jar.get(OWNER_ACCESS_COOKIE)?.value);
}

export async function getClientPortalAccessFromCookies(): Promise<NestAccessPayload | null> {
  const jar = await cookies();
  return verifyNestAccessToken(jar.get(CLIENT_PORTAL_ACCESS_COOKIE)?.value);
}
