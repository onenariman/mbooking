import { NextResponse } from "next/server";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { dispatchDueAppointmentReminders } from "@/src/server/push/reminders";
import { createClient } from "@/src/utils/supabase/server";

const getHeaderToken = (request: Request) => {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-cron-secret")?.trim() ?? null;
};

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const headerToken = getHeaderToken(request);

  if (cronSecret && headerToken === cronSecret) {
    try {
      const result = await dispatchDueAppointmentReminders({});

      return NextResponse.json({
        data: {
          mode: "all",
          ...result,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { message: mapSupabaseError(error) },
        { status: 500 },
      );
    }
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
    const result = await dispatchDueAppointmentReminders({
      userId: user.id,
    });

    return NextResponse.json({
      data: {
        mode: "self",
        ...result,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: mapSupabaseError(error) },
      { status: 500 },
    );
  }
}
