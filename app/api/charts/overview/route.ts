import { NextResponse } from "next/server";
import { z } from "zod";
import { AppointmentArraySchema } from "@/src/schemas/books/bookSchema";
import { ClientArraySchema } from "@/src/schemas/clients/clientSchema";
import { getNestServerBaseUrl } from "@/src/server/nest-internal";
import { resolveSessionFromCookies } from "@/src/server/nest-session";
import { applySessionCookiesToResponse } from "@/src/server/owner-session-cookies";
import {
  buildAppointmentsByDay,
  buildCategoriesSummary,
  buildRevenueByService,
  buildRevenueLossMetrics,
  buildStatusSummary,
  calculateMetrics,
  normalizeCategoryName,
} from "@/components/Charts/lib/analytics";

const requestSchema = z.object({
  from: z.string().datetime().nullable().optional(),
  to: z.string().datetime().nullable().optional(),
  category: z.string().trim().min(1).nullable().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = requestSchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    category: url.searchParams.get("category"),
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные параметры" }, { status: 400 });
  }

  const session = await resolveSessionFromCookies("owner");
  if (!session.accessToken) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const base = getNestServerBaseUrl();
  if (!base) {
    return NextResponse.json({ message: "Nest не настроен" }, { status: 503 });
  }

  const authHeaders = { Authorization: `Bearer ${session.accessToken}` };

  const [apRes, clRes] = await Promise.all([
    fetch(`${base}/v1/appointments`, {
      headers: authHeaders,
      cache: "no-store",
    }),
    fetch(`${base}/v1/clients`, {
      headers: authHeaders,
      cache: "no-store",
    }),
  ]);

  if (!apRes.ok) {
    const err = await apRes.json().catch(() => ({}));
    return NextResponse.json(
      { message: (err as { message?: string }).message || "Ошибка записей" },
      { status: apRes.status },
    );
  }
  if (!clRes.ok) {
    const err = await clRes.json().catch(() => ({}));
    return NextResponse.json(
      { message: (err as { message?: string }).message || "Ошибка клиентов" },
      { status: clRes.status },
    );
  }

  const apJson = (await apRes.json()) as { data?: unknown };
  const clJson = (await clRes.json()) as { data?: unknown };

  let appointmentsRaw = (apJson.data ?? []) as unknown[];
  const clientsRaw = (clJson.data ?? []) as unknown[];

  const dateFilter = {
    from: parsed.data.from ?? null,
    to: parsed.data.to ?? null,
  };

  if (dateFilter.from) {
    appointmentsRaw = appointmentsRaw.filter(
      (a) =>
        typeof (a as { appointment_at?: string }).appointment_at === "string" &&
        (a as { appointment_at: string }).appointment_at >= dateFilter.from!,
    );
  }
  if (dateFilter.to) {
    appointmentsRaw = appointmentsRaw.filter(
      (a) =>
        typeof (a as { appointment_at?: string }).appointment_at === "string" &&
        (a as { appointment_at: string }).appointment_at <= dateFilter.to!,
    );
  }

  let clientsFiltered = clientsRaw;
  if (dateFilter.from) {
    clientsFiltered = clientsFiltered.filter(
      (c) =>
        typeof (c as { created_at?: string }).created_at === "string" &&
        (c as { created_at: string }).created_at >= dateFilter.from!,
    );
  }
  if (dateFilter.to) {
    clientsFiltered = clientsFiltered.filter(
      (c) =>
        typeof (c as { created_at?: string }).created_at === "string" &&
        (c as { created_at: string }).created_at <= dateFilter.to!,
    );
  }

  const appointmentsParsed = AppointmentArraySchema.safeParse(appointmentsRaw);
  if (!appointmentsParsed.success) {
    return NextResponse.json(
      { message: "Данные записей не прошли валидацию" },
      { status: 500 },
    );
  }

  const clientsParsed = ClientArraySchema.safeParse(clientsFiltered);
  if (!clientsParsed.success) {
    return NextResponse.json(
      { message: "Данные клиентов не прошли валидацию" },
      { status: 500 },
    );
  }

  const appointments = appointmentsParsed.data;
  const clients = clientsParsed.data;

  const categoryOptions = Array.from(
    new Set(appointments.map((item) => normalizeCategoryName(item.category_name))),
  ).sort((a, b) => a.localeCompare(b, "ru"));

  const activeCategoryRaw = parsed.data.category;
  const activeCategory =
    !activeCategoryRaw || activeCategoryRaw === "all" ? "all" : activeCategoryRaw;

  const selectedAppointments =
    activeCategory === "all"
      ? appointments
      : appointments.filter(
          (item) => normalizeCategoryName(item.category_name) === activeCategory,
        );

  const overallMetrics = calculateMetrics(appointments, clients, dateFilter, false);
  const selectedMetrics = calculateMetrics(
    selectedAppointments,
    clients,
    dateFilter,
    activeCategory !== "all",
  );

  const appointmentsByDay = buildAppointmentsByDay(selectedAppointments);
  const revenueByService = buildRevenueByService(selectedAppointments);
  const statusSummary = buildStatusSummary(selectedMetrics);
  const categoriesSummary = buildCategoriesSummary(
    appointments,
    clients,
    dateFilter,
    overallMetrics.revenue,
  );
  const revenueLossMetrics = buildRevenueLossMetrics(selectedAppointments);

  const response = NextResponse.json({
    data: {
      dateFilter,
      categoryOptions: ["all", ...categoryOptions],
      activeCategory,
      overallMetrics,
      selectedMetrics,
      appointmentsByDay,
      revenueByService,
      statusSummary,
      categoriesSummary,
      revenueLossMetrics,
    },
  });
  if (session.sessionUpdate) {
    applySessionCookiesToResponse(response, "owner", session.sessionUpdate);
  }
  return response;
}
