import { NextResponse } from "next/server";
import { sendOwnerPushNotification, isPushConfigured } from "@/src/server/push/sendPush";
import { createClient } from "@/src/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      {
        message:
          "Push не настроен на сервере. Добавьте NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY и VAPID_SUBJECT.",
      },
      { status: 400 },
    );
  }

  const result = await sendOwnerPushNotification({
    ownerUserId: user.id,
    payload: {
      body: "Если вы видите это уведомление, push для мастера уже работает.",
      requireInteraction: true,
      tag: "owner-test-push",
      title: "Тестовое уведомление",
      url: "/receptions",
    },
  });

  if (result.sent === 0) {
    return NextResponse.json(
      { message: "Нет активных подписок. Сначала включите уведомления в браузере." },
      { status: 400 },
    );
  }

  return NextResponse.json({ data: result });
}
