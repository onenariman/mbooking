import { NextResponse } from "next/server";
import {
  getClientPortalContextFromSession,
  getClientPortalDiscounts,
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
    const data = await getClientPortalDiscounts(context);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Не удалось загрузить скидки клиента",
      },
      { status: 500 },
    );
  }
}
