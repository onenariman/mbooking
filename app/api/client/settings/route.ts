import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { clientSettingsSchema } from "@/src/schemas/client-portal/clientPortalSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = clientSettingsSchema.safeParse(body);

  if (!parsedBody.success) {
    const message =
      parsedBody.error.issues[0]?.message ?? "Некорректные данные";
    return NextResponse.json({ message }, { status: 400 });
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
    .from("client_portal_profiles")
    .update(parsedBody.data)
    .eq("auth_user_id", user.id)
    .select(clientPortalProfileSelect)
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ data });
}

const clientPortalProfileSelect =
  "auth_user_id, phone, display_name, notifications_enabled, created_at, last_login_at";
