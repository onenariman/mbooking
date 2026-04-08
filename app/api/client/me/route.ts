import { NextResponse } from "next/server";
import {
  getClientPortalContextFromSession,
  getClientPortalMe,
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

  await touchClientPortalSession(context);

  return NextResponse.json({ data: await getClientPortalMe(context) });
}
