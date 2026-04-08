import { type NextRequest } from "next/server";
import { jwtVerify } from "jose";

export const OWNER_ACCESS_COOKIE = "mbooking_owner_access";
export const OWNER_REFRESH_COOKIE = "mbooking_owner_refresh";

/** 15m — как типичный access JWT в Nest */
export const OWNER_ACCESS_COOKIE_MAX_AGE = 60 * 15;
/** 30d */
export const OWNER_REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type NestAccessPayload = {
  sub: string;
  role: string;
  email?: string;
  type?: string;
};

/** Валидный access JWT мастера или клиентского кабинета (Nest `User.role`). */
export async function verifyNestAccessToken(
  token: string | undefined,
): Promise<NestAccessPayload | null> {
  if (!token) return null;
  const secret =
    process.env.NEST_JWT_ACCESS_SECRET ?? process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 8) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    if (payload.type !== "access") return null;
    const role = typeof payload.role === "string" ? payload.role : "";
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    if (!sub || (role !== "owner" && role !== "client_portal")) return null;
    return {
      sub,
      role,
      email: typeof payload.email === "string" ? payload.email : undefined,
      type: typeof payload.type === "string" ? payload.type : undefined,
    };
  } catch {
    return null;
  }
}

export async function getNestAccessFromRequest(
  request: NextRequest,
): Promise<NestAccessPayload | null> {
  return verifyNestAccessToken(request.cookies.get(OWNER_ACCESS_COOKIE)?.value);
}

/** @deprecated используйте getNestAccessFromRequest */
export const getNestOwnerFromRequest = getNestAccessFromRequest;
