import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { discountSchema } from "@/src/schemas/discounts/discountSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Не задан id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("client_discounts")
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
      reserved_at: null,
      reserved_for_appointment_id: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_used", false)
    .select(
      "id, user_id, client_phone, appointment_id, feedback_token, discount_percent, is_used, used_at, created_at, source_type, note, expires_at, reserved_for_appointment_id, reserved_at, used_on_appointment_id, service_id, service_name_snapshot",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ message: "Скидка не найдена" }, { status: 404 });
  }

  const parsed = discountSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Ответ сервера не прошел валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsed.data });
}
