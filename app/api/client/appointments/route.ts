import { NextResponse } from "next/server";
import {
  getClientPortalAppointments,
  getClientPortalContextFromSession,
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

  try {
    await touchClientPortalSession(context);
    const data = await getClientPortalAppointments(context);
    const response = NextResponse.json({ data });
    if (context.sessionUpdate) {
      applySessionCookiesToResponse(
        response,
        "client_portal",
        context.sessionUpdate,
      );
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Не удалось загрузить записи клиента",
      },
      { status: 500 },
    );
  }
}
