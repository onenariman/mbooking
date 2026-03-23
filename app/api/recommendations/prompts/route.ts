import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import {
  recommendationPromptInputSchema,
  recommendationPromptSchema,
} from "@/src/schemas/feedback/feedbackSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

const createSchema = recommendationPromptInputSchema;

const updateSchema = z
  .object({
    name: createSchema.shape.name.optional(),
    content: createSchema.shape.content.optional(),
    is_default: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Нет полей для обновления",
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

  const { data, error } = await supabase
    .from("recommendation_prompts")
    .select("id, user_id, name, content, is_default, created_at, updated_at")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = z.array(recommendationPromptSchema).safeParse(data ?? []);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Данные промтов не прошли валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsed.data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = createSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  if (parsedBody.data.is_default) {
    const { error: resetError } = await supabase
      .from("recommendation_prompts")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (resetError) {
      return NextResponse.json({ message: mapSupabaseError(resetError) }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("recommendation_prompts")
    .insert({
      user_id: user.id,
      name: parsedBody.data.name,
      content: parsedBody.data.content,
      is_default: parsedBody.data.is_default ?? false,
    })
    .select("id, user_id, name, content, is_default, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = recommendationPromptSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Ответ сервера не прошёл валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsed.data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = updateSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
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

  if (parsedBody.data.is_default) {
    const { error: resetError } = await supabase
      .from("recommendation_prompts")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (resetError) {
      return NextResponse.json({ message: mapSupabaseError(resetError) }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("recommendation_prompts")
    .update({
      ...parsedBody.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, name, content, is_default, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = recommendationPromptSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Ответ сервера не прошёл валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsed.data });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
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
    .from("recommendation_prompts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { message: "Промпт не найден или недоступен для удаления" },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: true });
}
