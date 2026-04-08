import { cookies } from "next/headers";
import {
  OWNER_ACCESS_COOKIE,
  OWNER_ACCESS_COOKIE_MAX_AGE,
  OWNER_REFRESH_COOKIE,
  OWNER_REFRESH_COOKIE_MAX_AGE,
  verifyNestAccessToken,
  type NestAccessPayload,
} from "@/src/lib/owner-session";

const cookieBase = () => ({
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
});

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

/** Для Server Components / actions: тот же JWT, что проверяет middleware. */
export async function getNestAccessFromCookies(): Promise<NestAccessPayload | null> {
  const jar = await cookies();
  return verifyNestAccessToken(jar.get(OWNER_ACCESS_COOKIE)?.value);
}
