import { NextResponse } from "next/server";
import { activateClientInvitationSchema } from "@/src/schemas/client-portal/clientPortalSchema";
import {
  ClientPortalInviteError,
  activateClientPortalInvite,
} from "@/src/server/client-portal/invitations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsedBody = activateClientInvitationSchema.safeParse(body);

  if (!parsedBody.success) {
    const message =
      parsedBody.error.issues[0]?.message ?? "Некорректные данные";
    return NextResponse.json({ message }, { status: 400 });
  }

  try {
    const data = await activateClientPortalInvite({
      token,
      email: parsedBody.data.email,
      password: parsedBody.data.password,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ClientPortalInviteError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Не удалось активировать кабинет" },
      { status: 500 },
    );
  }
}
