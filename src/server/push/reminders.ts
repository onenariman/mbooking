import { sendOwnerPushNotification } from "@/src/server/push/sendPush";
import { supabaseAdmin } from "@/src/utils/supabase/admin";

export const ALLOWED_REMINDER_OFFSETS = [5, 15, 30, 60, 120, 180] as const;
export const DEFAULT_REMINDER_OFFSETS = [60, 5] as const;
export const MAX_REMINDER_OFFSETS = 3;

type AppointmentReminderRow = {
  appointment_id: string;
  id: string;
  offset_minutes: number;
  remind_at: string;
  status: string;
  user_id: string;
};

type AppointmentRow = {
  appointment_at: string | null;
  client_name: string;
  id: string;
  service_name: string;
  status: string;
  user_id: string;
};

const allowedOffsetsSet = new Set<number>(ALLOWED_REMINDER_OFFSETS);

export const normalizeReminderOffsets = (
  offsets: number[] | null | undefined,
  { fallbackToDefault = true }: { fallbackToDefault?: boolean } = {},
) => {
  const source = Array.isArray(offsets)
    ? offsets
    : fallbackToDefault
      ? [...DEFAULT_REMINDER_OFFSETS]
      : [];

  return [...new Set(source)]
    .filter((offset): offset is number => Number.isInteger(offset) && allowedOffsetsSet.has(offset))
    .sort((left, right) => right - left)
    .slice(0, MAX_REMINDER_OFFSETS);
};

export const getOwnerReminderOffsets = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("owner_notification_settings")
    .select("reminder_offsets_minutes")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeReminderOffsets(data?.reminder_offsets_minutes ?? null, {
    fallbackToDefault: !Array.isArray(data?.reminder_offsets_minutes),
  });
};

export const syncAppointmentRemindersForUser = async ({
  appointmentId,
  userId,
}: {
  appointmentId: string;
  userId: string;
}) => {
  const { data: appointmentData, error: appointmentError } = await supabaseAdmin
    .from("appointments")
    .select("id, user_id, client_name, service_name, appointment_at, status")
    .eq("id", appointmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (appointmentError) {
    throw appointmentError;
  }

  if (!appointmentData) {
    await supabaseAdmin
      .from("appointment_reminders")
      .delete()
      .eq("appointment_id", appointmentId)
      .eq("user_id", userId);

    return { created: 0, cancelled: 0 };
  }

  const appointment = appointmentData as AppointmentRow;
  const offsets = await getOwnerReminderOffsets(userId);

  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("appointment_reminders")
    .select("id, appointment_id, user_id, offset_minutes, remind_at, status")
    .eq("appointment_id", appointmentId)
    .eq("user_id", userId);

  if (existingError) {
    throw existingError;
  }

  const existing = (existingRows ?? []) as AppointmentReminderRow[];
  const now = Date.now();

  if (appointment.status !== "booked" || !appointment.appointment_at) {
    if (existing.length > 0) {
      await supabaseAdmin
        .from("appointment_reminders")
        .update({
          cancelled_at: new Date().toISOString(),
          status: "cancelled",
        })
        .eq("appointment_id", appointmentId)
        .eq("user_id", userId)
        .neq("status", "cancelled");
    }

    return { created: 0, cancelled: existing.length };
  }

  const appointmentTime = new Date(appointment.appointment_at).getTime();
  if (Number.isNaN(appointmentTime)) {
    return { created: 0, cancelled: 0 };
  }

  const desiredRows = offsets
    .map((offset) => ({
      appointment_id: appointmentId,
      offset_minutes: offset,
      remind_at: new Date(appointmentTime - offset * 60_000).toISOString(),
      user_id: userId,
    }))
    .filter((row) => new Date(row.remind_at).getTime() > now);

  const desiredOffsets = new Set(desiredRows.map((row) => row.offset_minutes));
  const obsoleteIds = existing
    .filter((row) => !desiredOffsets.has(row.offset_minutes) && row.status !== "cancelled")
    .map((row) => row.id);

  if (obsoleteIds.length > 0) {
    await supabaseAdmin
      .from("appointment_reminders")
      .update({
        cancelled_at: new Date().toISOString(),
        status: "cancelled",
      })
      .in("id", obsoleteIds);
  }

  if (desiredRows.length > 0) {
    await supabaseAdmin.from("appointment_reminders").upsert(
      desiredRows.map((row) => ({
        ...row,
        cancelled_at: null,
        sent_at: null,
        status: "pending",
      })),
      {
        onConflict: "appointment_id,offset_minutes",
      },
    );
  }

  return {
    cancelled: obsoleteIds.length,
    created: desiredRows.length,
  };
};

export const syncAllAppointmentRemindersForUser = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("user_id", userId)
    .order("appointment_at", { ascending: true });

  if (error) {
    throw error;
  }

  let totalCreated = 0;
  let totalCancelled = 0;

  for (const appointment of data ?? []) {
    const result = await syncAppointmentRemindersForUser({
      appointmentId: appointment.id,
      userId,
    });

    totalCreated += result.created;
    totalCancelled += result.cancelled;
  }

  return {
    totalCancelled,
    totalCreated,
  };
};

const formatOffsetLabel = (offsetMinutes: number) => {
  if (offsetMinutes < 60) {
    return `${offsetMinutes} мин`;
  }

  const hours = offsetMinutes / 60;
  if (hours === 1) {
    return "1 час";
  }
  if (hours >= 2 && hours <= 4) {
    return `${hours} часа`;
  }
  return `${hours} часов`;
};

export const dispatchDueAppointmentReminders = async ({
  userId,
}: {
  userId?: string;
}) => {
  let query = supabaseAdmin
    .from("appointment_reminders")
    .select("id, appointment_id, user_id, offset_minutes, remind_at, status")
    .eq("status", "pending")
    .lte("remind_at", new Date().toISOString())
    .order("remind_at", { ascending: true });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: remindersRows, error: remindersError } = await query;

  if (remindersError) {
    throw remindersError;
  }

  const reminders = (remindersRows ?? []) as AppointmentReminderRow[];
  if (reminders.length === 0) {
    return {
      cancelled: 0,
      sent: 0,
    };
  }

  const appointmentIds = [...new Set(reminders.map((reminder) => reminder.appointment_id))];
  const { data: appointmentsRows, error: appointmentsError } = await supabaseAdmin
    .from("appointments")
    .select("id, user_id, client_name, service_name, appointment_at, status")
    .in("id", appointmentIds);

  if (appointmentsError) {
    throw appointmentsError;
  }

  const appointmentsMap = new Map(
    ((appointmentsRows ?? []) as AppointmentRow[]).map((appointment) => [
      appointment.id,
      appointment,
    ]),
  );

  let sent = 0;
  let cancelled = 0;

  for (const reminder of reminders) {
    const appointment = appointmentsMap.get(reminder.appointment_id);
    const appointmentAtTime = appointment?.appointment_at
      ? new Date(appointment.appointment_at).getTime()
      : Number.NaN;

    if (
      !appointment ||
      appointment.status !== "booked" ||
      !appointment.appointment_at ||
      Number.isNaN(appointmentAtTime) ||
      appointmentAtTime <= Date.now()
    ) {
      await supabaseAdmin
        .from("appointment_reminders")
        .update({
          cancelled_at: new Date().toISOString(),
          status: "cancelled",
        })
        .eq("id", reminder.id);

      cancelled += 1;
      continue;
    }

    const result = await sendOwnerPushNotification({
      ownerUserId: reminder.user_id,
      payload: {
        body: `${appointment.client_name} - ${appointment.service_name}`,
        requireInteraction: reminder.offset_minutes <= 15,
        tag: `appointment-reminder-${reminder.appointment_id}-${reminder.offset_minutes}`,
        title: `Запись через ${formatOffsetLabel(reminder.offset_minutes)}`,
        url: "/receptions",
      },
    });

    if (result.sent > 0) {
      await supabaseAdmin
        .from("appointment_reminders")
        .update({
          sent_at: new Date().toISOString(),
          status: "sent",
        })
        .eq("id", reminder.id);

      sent += 1;
      continue;
    }

    if (result.skipped || result.failed > 0) {
      continue;
    }

    await supabaseAdmin
      .from("appointment_reminders")
      .update({
        cancelled_at: new Date().toISOString(),
        status: "cancelled",
      })
      .eq("id", reminder.id);

    cancelled += 1;
  }

  return {
    cancelled,
    sent,
  };
};
