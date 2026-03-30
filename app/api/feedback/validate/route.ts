import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/utils/supabase/admin";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.json({ message: "Не задан token" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("feedback_tokens")
    .select("appointment_id, is_active, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const tokenRow = data ?? null;
  const isValid =
    tokenRow !== null &&
    tokenRow.is_active === true &&
    tokenRow.used_at === null &&
    new Date(tokenRow.expires_at).getTime() > Date.now();

  return NextResponse.json({
    data: {
      valid: isValid,
      appointment_id: isValid ? tokenRow?.appointment_id ?? null : null,
    },
  });
}
