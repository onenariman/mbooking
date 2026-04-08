import { type NextRequest, NextResponse } from "next/server";
import { OWNER_ACCESS_COOKIE } from "@/src/lib/owner-session";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ path?: string[] }> };

async function forward(req: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const { path: segments = [] } = await ctx.params;
  if (segments.some((s) => s.includes(".."))) {
    return NextResponse.json({ message: "Некорректный путь" }, { status: 400 });
  }

  const token = req.cookies.get(OWNER_ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Требуется вход" }, { status: 401 });
  }

  const base = getNestServerBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "Nest не настроен" }, { status: 503 });
  }

  const subpath = segments.join("/");
  const url = `${base}/v1/${subpath}${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  const incomingCt = req.headers.get("content-type");
  if (incomingCt) {
    headers.set("content-type", incomingCt);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    init.body = req.body;
    Object.assign(init, { duplex: "half" as const });
  }

  const res = await fetch(url, init);
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

  return out;
}

export function GET(req: NextRequest, ctx: RouteCtx) {
  return forward(req, ctx);
}

export function POST(req: NextRequest, ctx: RouteCtx) {
  return forward(req, ctx);
}

export function PATCH(req: NextRequest, ctx: RouteCtx) {
  return forward(req, ctx);
}

export function PUT(req: NextRequest, ctx: RouteCtx) {
  return forward(req, ctx);
}

export function DELETE(req: NextRequest, ctx: RouteCtx) {
  return forward(req, ctx);
}
