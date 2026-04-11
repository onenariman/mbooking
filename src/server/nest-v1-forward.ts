import { type NextRequest, NextResponse } from "next/server";
import { resolveSessionFromRequest } from "@/src/server/nest-session-shared";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import {
  applySessionCookiesToResponse,
  clearSessionCookiesOnResponse,
  type SessionKind,
} from "@/src/server/owner-session-cookies";

export type NestV1CatchAllCtx = { params: Promise<{ path?: string[] }> };

export async function forwardNestV1Request(
  kind: SessionKind,
  req: NextRequest,
  ctx: NestV1CatchAllCtx,
): Promise<NextResponse> {
  const { path: segments = [] } = await ctx.params;
  if (segments.some((s) => s.includes(".."))) {
    return NextResponse.json({ message: "Некорректный путь" }, { status: 400 });
  }

  const base = getNestServerBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "Nest не настроен" }, { status: 503 });
  }

  const session = await resolveSessionFromRequest(req, kind);
  if (!session.accessToken) {
    const response = NextResponse.json(
      { message: "Требуется вход" },
      { status: 401 },
    );
    if (session.clearCookies) {
      clearSessionCookiesOnResponse(response, kind);
    }
    return response;
  }

  const subpath = segments.join("/");
  const url = `${base}/v1/${subpath}${req.nextUrl.search}`;

  const bodyBuffer =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const init = (): RequestInit => {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${session.accessToken}`);
    const incomingCt = req.headers.get("content-type");
    if (incomingCt) {
      headers.set("content-type", incomingCt);
    }

    const requestInit: RequestInit = {
      method: req.method,
      headers,
      cache: "no-store",
    };

    if (bodyBuffer && bodyBuffer.byteLength > 0) {
      requestInit.body = bodyBuffer.slice(0);
      Object.assign(requestInit, { duplex: "half" as const });
    }

    return requestInit;
  };

  const res = await fetch(url, init());
  const out = new NextResponse(res.body, { status: res.status });

  res.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (
      lk === "transfer-encoding" ||
      lk === "connection" ||
      lk === "keep-alive"
    ) {
      return;
    }
    out.headers.set(key, value);
  });

  if (session.sessionUpdate) {
    applySessionCookiesToResponse(out, kind, session.sessionUpdate);
  } else if (session.clearCookies) {
    clearSessionCookiesOnResponse(out, kind);
  }

  return out;
}
