import { type NextRequest, NextResponse } from "next/server";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import { applySessionCookiesToResponse } from "@/src/server/owner-session-cookies";

export const runtime = "nodejs";

const STATE_COOKIE = "mbooking_owner_yandex_oauth_state";

function originFrom(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function GET(req: NextRequest) {
  const origin = originFrom(req);

  const redirectFail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/?error=${code}`, origin));
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const yandexError = req.nextUrl.searchParams.get("error");
  if (yandexError) {
    return redirectFail("oauth_cancelled");
  }
  if (!code || !state) {
    return redirectFail("oauth_failed");
  }

  const expected = req.cookies.get(STATE_COOKIE)?.value;
  if (!expected || expected !== state) {
    return redirectFail("oauth_failed");
  }

  const nest = getNestServerBaseUrl();
  const secret = process.env.NEST_OAUTH_CALLBACK_SECRET?.trim();
  if (!nest || !secret) {
    return redirectFail("oauth_misconfigured");
  }

  const tokenRes = await fetch(`${nest}/v1/auth/yandex/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-oauth-callback-secret": secret,
    },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });

  const json = (await tokenRes.json().catch(() => ({}))) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!tokenRes.ok || !json.accessToken || !json.refreshToken) {
    return redirectFail("oauth_failed");
  }

  const res = NextResponse.redirect(new URL("/receptions", origin));
  res.cookies.delete(STATE_COOKIE);
  applySessionCookiesToResponse(res, "owner", {
    accessToken: json.accessToken,
    refreshToken: json.refreshToken,
  });
  return res;
}
