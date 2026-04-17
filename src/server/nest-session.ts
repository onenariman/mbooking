import { cookies } from "next/headers";
import {
  verifyNestAccessToken,
} from "@/src/lib/owner-session";
import {
  getSessionCookieNames,
} from "@/src/server/owner-session-cookies";
import {
  refreshNestSessionTokens,
  type ResolvedSession,
} from "@/src/server/nest-session-shared";
import { type SessionKind } from "@/src/server/owner-session-cookies";

export { refreshNestSessionTokens };
export type { ResolvedSession };

export async function resolveSessionFromCookies(
  kind: SessionKind,
): Promise<ResolvedSession> {
  const jar = await cookies();
  const config = getSessionCookieNames(kind);
  const accessToken = jar.get(config.accessCookieName)?.value;
  const payload = await verifyNestAccessToken(accessToken);
  if (payload && accessToken) {
    return { accessToken, payload };
  }

  const refreshToken = jar.get(config.refreshCookieName)?.value;
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
