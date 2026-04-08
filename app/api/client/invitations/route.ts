import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { createClientInvitationSchema } from "@/src/schemas/client-portal/clientPortalSchema";
import {
  ClientPortalInviteError,
  createClientPortalInvite,
} from "@/src/server/client-portal/invitations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = createClientInvitationSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Некорректные данные" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  if (user.user_metadata?.role === "client_portal") {
    return NextResponse.json(
      {
        message:
          "Сейчас в браузере открыт клиентский кабинет. Войдите заново через /login как администратор.",
      },
      { status: 403 },
    );
  }

  if (
    parsedBody.data.client_user_id &&
    parsedBody.data.client_user_id !== user.id
  ) {
    return NextResponse.json(
      {
        message:
          "Этот клиент принадлежит другому аккаунту. Войдите в админку под тем же пользователем, под которым открыт список клиентов.",
      },
      { status: 403 },
    );
  }

  try {
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const data = await createClientPortalInvite({
      ownerUserId: user.id,
      createdBy: user.id,
      clientId: parsedBody.data.client_id,
      clientPhone: parsedBody.data.client_phone,
      purpose: parsedBody.data.purpose,
      expiresInHours: parsedBody.data.expires_in_hours,
      appBaseUrl,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ClientPortalInviteError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Не удалось создать приглашение" },
      { status: 500 },
    );
  }
}
