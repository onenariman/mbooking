import { NextResponse } from "next/server";
import {
  getClientPortalAppointments,
  getClientPortalContextFromSession,
  touchClientPortalSession,
} from "@/src/server/client-portal/context";

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
    return NextResponse.json({ data });
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
