import { NextResponse } from "next/server";
import { z } from "zod";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { syncAppointmentRemindersForUser } from "@/src/server/push/reminders";
import { createClient } from "@/src/utils/supabase/server";

const bodySchema = z.object({
  appointment_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Некорректный appointment_id" },
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

  try {
    const result = await syncAppointmentRemindersForUser({
      appointmentId: parsedBody.data.appointment_id,
      userId: user.id,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { message: mapSupabaseError(error) },
      { status: 500 },
    );
  }
}
