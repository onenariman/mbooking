import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import {
  ServiceArraySchema,
  serviceSchema,
} from "@/src/schemas/services/serviceSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";

const createSchema = serviceSchema.pick({
  name: true,
  category_id: true,
  price: true,
});

const updateSchema = z
  .object({
    name: createSchema.shape.name.optional(),
    category_id: createSchema.shape.category_id.optional(),
    price: createSchema.shape.price.optional(),
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
    .from("services")
    .select("id, created_at, user_id, name, category_id, price")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = ServiceArraySchema.safeParse(data ?? []);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Данные услуг не прошли валидацию" },
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

  const { data, error } = await supabase
    .from("services")
    .insert(parsedBody.data)
    .select("id, created_at, user_id, name, category_id, price")
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = serviceSchema.safeParse(data);
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

  const { data, error } = await supabase
    .from("services")
    .update(parsedBody.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, created_at, user_id, name, category_id, price")
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = serviceSchema.safeParse(data);
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

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  return NextResponse.json({ data: true });
}
