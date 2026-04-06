import { NextResponse } from "next/server";
import { z } from "zod";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { sendOwnerAppointmentEventPush } from "@/src/server/push/appointments";
import { createClient } from "@/src/utils/supabase/server";

const bodySchema = z.object({
  appointment_id: z.string().uuid(),
  appointment_label: z.string().trim().max(120).nullable().optional(),
  event: z.enum(["created", "rescheduled", "cancelled"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Некорректные данные push-события" },
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

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, client_name, service_name, status")
    .eq("id", parsedBody.data.appointment_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (appointmentError) {
    return NextResponse.json(
      { message: mapSupabaseError(appointmentError) },
      { status: 500 },
    );
  }

  if (!appointment) {
    return NextResponse.json({ message: "Запись не найдена" }, { status: 404 });
  }

  if (
    (parsedBody.data.event === "created" || parsedBody.data.event === "rescheduled") &&
    appointment.status !== "booked"
  ) {
    return NextResponse.json({
      data: {
        skipped: true,
      },
    });
  }

  if (parsedBody.data.event === "cancelled" && appointment.status !== "cancelled") {
    return NextResponse.json({
      data: {
        skipped: true,
      },
    });
  }

  try {
    const result = await sendOwnerAppointmentEventPush({
      appointment,
      appointmentLabel: parsedBody.data.appointment_label,
      event: parsedBody.data.event,
      ownerUserId: user.id,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { message: mapSupabaseError(error) },
      { status: 500 },
    );
  }
}
