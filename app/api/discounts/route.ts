import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import {
  discountArraySchema,
  createDiscountSchema,
  discountSchema,
} from "@/src/schemas/discounts/discountSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { normalizePhone } from "@/src/validators/normalizePhone";

const requestSchema = createDiscountSchema.extend({
  discount_percent: z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    createDiscountSchema.shape.discount_percent,
  ),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawPhone = url.searchParams.get("phone");
  const rawServiceId = url.searchParams.get("service_id");
  const isUsedParam = url.searchParams.get("is_used");
  const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;
  const serviceId = rawServiceId && z.string().uuid().safeParse(rawServiceId).success
    ? rawServiceId
    : null;

  if (rawPhone && !normalizedPhone) {
    return NextResponse.json({ data: [] });
  }

  if (rawServiceId && !serviceId) {
    return NextResponse.json({ data: [] });
  }

  let query = supabase
    .from("client_discounts")
    .select(
      "id, user_id, client_phone, appointment_id, feedback_token, discount_percent, is_used, used_at, created_at, source_type, note, expires_at, reserved_for_appointment_id, reserved_at, used_on_appointment_id, service_id, service_name_snapshot",
    )
    .eq("user_id", user.id)
    .order("is_used", { ascending: true })
    .order("created_at", { ascending: false });

  if (normalizedPhone) {
    query = query.eq("client_phone", normalizedPhone);
  }

  if (serviceId) {
    query = query.eq("service_id", serviceId);
  }

  if (isUsedParam === "true") {
    query = query.eq("is_used", true);
  }

  if (isUsedParam === "false") {
    query = query.eq("is_used", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const now = Date.now();
  const filteredData =
    isUsedParam === "false"
      ? (data ?? []).filter((item) => {
          const expiresAt = item.expires_at ? new Date(item.expires_at).getTime() : null;
          return expiresAt === null || expiresAt > now;
        })
      : (data ?? []);

  const parsed = discountArraySchema.safeParse(filteredData);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Данные скидок не прошли валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsed.data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = requestSchema.safeParse(body);
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

  const normalizedPhone = normalizePhone(parsedBody.data.client_phone);
  if (!normalizedPhone) {
    return NextResponse.json(
      { message: "Телефон клиента должен быть в формате 7XXXXXXXXXX" },
      { status: 400 },
    );
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name")
    .eq("id", parsedBody.data.service_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (serviceError) {
    return NextResponse.json(
      { message: mapSupabaseError(serviceError) },
      { status: 500 },
    );
  }

  if (!service) {
    return NextResponse.json(
      { message: "Услуга для скидки не найдена" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("client_discounts")
    .insert({
      user_id: user.id,
      client_phone: normalizedPhone,
      feedback_token: null,
      discount_percent: parsedBody.data.discount_percent,
      source_type: "manual",
      note: parsedBody.data.note ?? null,
      expires_at: parsedBody.data.expires_at ?? null,
      service_id: service.id,
      service_name_snapshot: service.name,
    })
    .select(
      "id, user_id, client_phone, appointment_id, feedback_token, discount_percent, is_used, used_at, created_at, source_type, note, expires_at, reserved_for_appointment_id, reserved_at, used_on_appointment_id, service_id, service_name_snapshot",
    )
    .single();

  if (error) {
    return NextResponse.json({ message: mapSupabaseError(error) }, { status: 500 });
  }

  const parsed = discountSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Ответ сервера не прошел валидацию" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: parsed.data }, { status: 201 });
}
