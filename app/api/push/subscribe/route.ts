import { NextResponse } from "next/server";
import { z } from "zod";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { createClient } from "@/src/utils/supabase/server";

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      auth: z.string().min(1),
      p256dh: z.string().min(1),
    }),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректная push-подписка" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      audience: "owner",
      auth: parsed.data.subscription.keys.auth,
      auth_user_id: user.id,
      endpoint: parsed.data.subscription.endpoint,
      owner_user_id: user.id,
      p256dh: parsed.data.subscription.keys.p256dh,
    },
    {
      onConflict: "auth_user_id,owner_user_id,endpoint",
    },
  );

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректный endpoint" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("auth_user_id", user.id)
    .eq("owner_user_id", user.id)
    .eq("audience", "owner")
    .eq("endpoint", parsed.data.endpoint);

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}
