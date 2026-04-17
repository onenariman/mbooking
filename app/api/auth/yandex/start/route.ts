import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const STATE_COOKIE = "mbooking_owner_yandex_oauth_state";
const STATE_MAX_AGE = 600;

function trimEnv(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

export async function GET() {
  const clientId = trimEnv(process.env.YANDEX_OAUTH_CLIENT_ID);
  const redirectUri = trimEnv(process.env.YANDEX_OAUTH_REDIRECT_URI);
  const origin =
    trimEnv(process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/$/, "") ??
    "http://localhost:3000";

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(
      new URL("/?error=oauth_misconfigured", origin),
    );
  }

  const state = randomBytes(24).toString("hex");
  const authorize = new URL("https://oauth.yandex.ru/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("scope", "login:email");

  const res = NextResponse.redirect(authorize.toString());
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: STATE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
