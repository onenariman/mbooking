import { NextResponse } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const jobId = params.id;
  if (!jobId) {
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
    .from("recommendation_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .limit(1);

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ message: "Задача не найдена" }, { status: 404 });
  }

  return NextResponse.json({ data: data[0] });
}
