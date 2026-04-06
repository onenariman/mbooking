import { NextResponse } from "next/server";
import { z } from "zod";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import {
  ALLOWED_REMINDER_OFFSETS,
  MAX_REMINDER_OFFSETS,
  getOwnerReminderOffsets,
  normalizeReminderOffsets,
  syncAllAppointmentRemindersForUser,
} from "@/src/server/push/reminders";
import { createClient } from "@/src/utils/supabase/server";

const bodySchema = z.object({
  reminder_offsets_minutes: z.array(z.number().int()).max(MAX_REMINDER_OFFSETS),
});

const buildResponseData = (reminderOffsetsMinutes: number[]) => ({
  allowed_offsets_minutes: [...ALLOWED_REMINDER_OFFSETS],
  max_selected: MAX_REMINDER_OFFSETS,
  reminder_offsets_minutes: reminderOffsetsMinutes,
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  try {
    const reminderOffsetsMinutes = await getOwnerReminderOffsets(user.id);

    return NextResponse.json({
      data: buildResponseData(reminderOffsetsMinutes),
    });
  } catch (error) {
    return NextResponse.json(
      { message: mapSupabaseError(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Некорректные настройки уведомлений" },
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

  const reminderOffsetsMinutes = normalizeReminderOffsets(
    parsedBody.data.reminder_offsets_minutes,
    { fallbackToDefault: false },
  );
  const nowIso = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("owner_notification_settings")
    .upsert(
      {
        reminder_offsets_minutes: reminderOffsetsMinutes,
        updated_at: nowIso,
        user_id: user.id,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.json(
      { message: mapSupabaseError(upsertError) },
      { status: 500 },
    );
  }

  try {
    const syncResult = await syncAllAppointmentRemindersForUser(user.id);

    return NextResponse.json({
      data: {
        ...buildResponseData(reminderOffsetsMinutes),
        sync: syncResult,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: mapSupabaseError(error) },
      { status: 500 },
    );
  }
}
