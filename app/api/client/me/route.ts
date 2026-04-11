import { NextResponse } from "next/server";
import {
  getClientPortalContextFromSession,
  getClientPortalMe,
  touchClientPortalSession,
} from "@/client/server/context";
import { applySessionCookiesToResponse } from "@/src/server/owner-session-cookies";

export async function GET() {
  const context = await getClientPortalContextFromSession();

  if (!context) {
    return NextResponse.json(
      { message: "Клиентский кабинет не активирован" },
      { status: 403 },
    );
  }

  await touchClientPortalSession(context);

  const response = NextResponse.json({ data: await getClientPortalMe(context) });
  if (context.sessionUpdate) {
    applySessionCookiesToResponse(
      response,
      "client_portal",
      context.sessionUpdate,
    );
  }
  return response;
}
