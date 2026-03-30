import { NextResponse } from "next/server";
import { z } from "zod";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
import { createClient } from "@/src/utils/supabase/server";

const nonNegativeNumberSchema = z.number().finite().nonnegative();

const bodySchema = z.object({
  amount: nonNegativeNumberSchema.nullable().optional(),
  extra_amount: nonNegativeNumberSchema.nullable().optional(),
  ignore_discount: z.boolean().optional(),
  service_amount: nonNegativeNumberSchema.nullable().optional(),
});

const DEFAULT_FEEDBACK_EXPIRES_IN = "14 days";

const buildFeedbackUrl = (request: Request, token: string) => {
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return `${origin.replace(/\/$/, "")}/feedback/${token}`;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "Не задан id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = bodySchema.safeParse(body);

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

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, client_phone, service_id, service_name, status, applied_discount_id")
    .eq("id", id)
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

  if (appointment.status === "completed") {
    return NextResponse.json(
      { message: "Запись уже завершена" },
      { status: 400 },
    );
  }

  const shouldApplyDiscount =
    Boolean(appointment.applied_discount_id) && !parsedBody.data.ignore_discount;
  const nowIso = new Date().toISOString();

  let appointmentUpdates:
    | {
        amount: number;
        applied_discount_id?: null;
        discount_amount?: number | null;
        extra_amount?: number | null;
        service_amount?: number | null;
        status: "completed";
      }
    | undefined;

  if (shouldApplyDiscount) {
    const serviceAmount = parsedBody.data.service_amount;
    const extraAmount = parsedBody.data.extra_amount ?? 0;

    if (serviceAmount === undefined || serviceAmount === null) {
      return NextResponse.json(
        { message: "Укажите стоимость услуги для расчета скидки" },
        { status: 400 },
      );
    }

    const { data: discount, error: discountError } = await supabase
      .from("client_discounts")
      .select(
        "id, client_phone, discount_percent, expires_at, is_used, service_id, service_name_snapshot",
      )
      .eq("id", appointment.applied_discount_id!)
      .eq("user_id", user.id)
      .maybeSingle();

    if (discountError) {
      return NextResponse.json(
        { message: mapSupabaseError(discountError) },
        { status: 500 },
      );
    }

    if (!discount) {
      return NextResponse.json(
        { message: "Выбранная скидка не найдена" },
        { status: 400 },
      );
    }

    if (discount.client_phone !== appointment.client_phone) {
      return NextResponse.json(
        { message: "Скидка привязана к другому клиенту" },
        { status: 400 },
      );
    }

    if (discount.service_id && appointment.service_id !== discount.service_id) {
      return NextResponse.json(
        {
          message: `Скидка действует только на услугу "${
            discount.service_name_snapshot ?? appointment.service_name
          }"`,
        },
        { status: 400 },
      );
    }

    if (discount.is_used) {
      return NextResponse.json(
        { message: "Эта скидка уже была использована" },
        { status: 400 },
      );
    }

    if (discount.expires_at && new Date(discount.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "Срок действия скидки истек" },
        { status: 400 },
      );
    }

    const discountAmount = Math.round(
      (serviceAmount * discount.discount_percent) / 100,
    );
    const finalAmount = Math.max(serviceAmount - discountAmount, 0) + extraAmount;

    appointmentUpdates = {
      amount: finalAmount,
      discount_amount: discountAmount,
      extra_amount: extraAmount,
      service_amount: serviceAmount,
      status: "completed",
    };
  } else {
    const amount = parsedBody.data.amount;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { message: "Укажите итоговую стоимость" },
        { status: 400 },
      );
    }

    appointmentUpdates = {
      amount,
      ...(appointment.applied_discount_id && parsedBody.data.ignore_discount
        ? {
            applied_discount_id: null,
            discount_amount: null,
            extra_amount: null,
            service_amount: null,
          }
        : {}),
      status: "completed",
    };
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update(appointmentUpdates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { message: mapSupabaseError(updateError) },
      { status: 500 },
    );
  }

  if (shouldApplyDiscount) {
    const { error: consumeDiscountError } = await supabase
      .from("client_discounts")
      .update({
        is_used: true,
        reserved_at: null,
        reserved_for_appointment_id: null,
        used_at: nowIso,
        used_on_appointment_id: id,
      })
      .eq("id", appointment.applied_discount_id!)
      .eq("user_id", user.id)
      .eq("is_used", false);

    if (consumeDiscountError) {
      return NextResponse.json(
        {
          message:
            "Визит завершен, но скидку не удалось списать. Проверьте скидки клиента вручную.",
        },
        { status: 500 },
      );
    }
  }

  const { data: existingToken, error: existingTokenError } = await supabase
    .from("feedback_tokens")
    .select("token")
    .eq("user_id", user.id)
    .eq("appointment_id", id)
    .eq("is_active", true)
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingTokenError) {
    return NextResponse.json(
      { message: mapSupabaseError(existingTokenError) },
      { status: 500 },
    );
  }

  let feedbackToken = existingToken?.token ?? null;

  if (!feedbackToken) {
    const { data: createdToken, error: createTokenError } = await supabase.rpc(
      "create_feedback_token",
      {
        p_expires_in: DEFAULT_FEEDBACK_EXPIRES_IN,
      },
    );

    if (createTokenError) {
      return NextResponse.json(
        { message: mapSupabaseError(createTokenError) },
        { status: 500 },
      );
    }

    if (!createdToken) {
      return NextResponse.json(
        { message: "Не удалось создать feedback token" },
        { status: 500 },
      );
    }

    feedbackToken = createdToken;

    const { error: linkTokenError } = await supabase
      .from("feedback_tokens")
      .update({ appointment_id: id })
      .eq("user_id", user.id)
      .eq("token", feedbackToken);

    if (linkTokenError) {
      return NextResponse.json(
        { message: mapSupabaseError(linkTokenError) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    data: {
      feedback_token: feedbackToken,
      feedback_url: buildFeedbackUrl(request, feedbackToken),
    },
  });
}
