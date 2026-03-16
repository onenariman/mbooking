import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/server";
import { AppointmentArraySchema } from "@/src/schemas/books/bookSchema";
import { ClientArraySchema } from "@/src/schemas/clients/clientSchema";
import { mapSupabaseError } from "@/src/helpers/getErrorMessage";
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

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const dateFilter = {
    from: parsed.data.from ?? null,
    to: parsed.data.to ?? null,
  };

  let appointmentsQuery = supabase
    .from("appointments")
    .select(
      "id, created_at, user_id, client_name, client_phone, service_name, category_name, appointment_at, appointment_end, status, amount, notes",
    )
    .order("appointment_at", { ascending: true });

  if (dateFilter.from) {
    appointmentsQuery = appointmentsQuery.gte("appointment_at", dateFilter.from);
  }
  if (dateFilter.to) {
    appointmentsQuery = appointmentsQuery.lte("appointment_at", dateFilter.to);
  }

  const { data: appointmentsRaw, error: appointmentsError } = await appointmentsQuery;
  if (appointmentsError) {
    return NextResponse.json(
      { message: mapSupabaseError(appointmentsError) },
      { status: 500 },
    );
  }

  const appointmentsParsed = AppointmentArraySchema.safeParse(appointmentsRaw ?? []);
  if (!appointmentsParsed.success) {
    return NextResponse.json(
      { message: "Данные записей не прошли валидацию" },
      { status: 500 },
    );
  }

  let clientsQuery = supabase
    .from("clients")
    .select("id, created_at, name, phone, user_id")
    .order("created_at", { ascending: false });

  if (dateFilter.from) {
    clientsQuery = clientsQuery.gte("created_at", dateFilter.from);
  }
  if (dateFilter.to) {
    clientsQuery = clientsQuery.lte("created_at", dateFilter.to);
  }

  const { data: clientsRaw, error: clientsError } = await clientsQuery;
  if (clientsError) {
    return NextResponse.json(
      { message: mapSupabaseError(clientsError) },
      { status: 500 },
    );
  }

  const clientsParsed = ClientArraySchema.safeParse(clientsRaw ?? []);
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

  return NextResponse.json({
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
}

