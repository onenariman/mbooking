import { NextResponse } from "next/server";
import {
  ClientPortalInviteError,
  validateClientPortalInvite,
} from "@/src/server/client-portal/invitations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const { invite, client_name, client_phone_display } =
      await validateClientPortalInvite(token);

    return NextResponse.json({
      data: {
        client_phone: invite.client_phone,
        client_phone_display,
        client_name,
        purpose: invite.purpose,
        expires_at: invite.expires_at,
      },
    });
  } catch (error) {
    if (error instanceof ClientPortalInviteError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Не удалось проверить приглашение" },
      { status: 500 },
    );
  }
}
