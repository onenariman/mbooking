import {
  ZodAppointment,
  ZodAppointmentStatus,
  ZodCreateAppointment,
} from "../schemas/books/bookSchema";
import {
  isNestBackendConfigured,
  nestErrorMessage,
  nestOwnerFetch,
} from "@/src/utils/api/nestOwnerApi";

const DEFAULT_CATEGORY = "Без категории";

type DateFilter = {
  from: string | null;
  to: string | null;
};

type AppointmentRowLike = Omit<ZodAppointment, "status"> & {
  status: string;
};

const normalizeAppointment = (appointment: AppointmentRowLike): ZodAppointment => ({
  ...appointment,
  status: appointment.status as ZodAppointmentStatus,
});

const syncAppointmentReminders = async (appointmentId: string) => {
  try {
    const response = await nestOwnerFetch("push/reminders/sync", {
      method: "POST",
      body: JSON.stringify({ appointment_id: appointmentId }),
    });
    if (!response.ok) {
      const msg = await nestErrorMessage(response);
      console.error("Failed to sync appointment reminders:", msg);
    }
  } catch (error) {
    console.error("Failed to sync appointment reminders:", error);
  }
};

export class BookingOverlapError extends Error {
  code = "BOOKING_OVERLAP" as const;

  constructor(message = "Выбранный слот уже занят") {
    super(message);
    this.name = "BookingOverlapError";
  }
}

function assertNest() {
  if (!isNestBackendConfigured()) {
    throw new Error("Nest BFF отключён");
  }
}

export const fetchAppointments = async ({
  from,
  to,
}: DateFilter): Promise<ZodAppointment[]> => {
  assertNest();
  const response = await nestOwnerFetch("appointments", { method: "GET" });
  const payload = (await response.json()) as {
    data?: AppointmentRowLike[];
    message?: string;
  };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  let list = payload.data ?? [];
  if (from) {
    list = list.filter((a) => a.appointment_at && a.appointment_at >= from);
  }
  if (to) {
    list = list.filter((a) => a.appointment_at && a.appointment_at <= to);
  }
  return list.map((item) => normalizeAppointment(item));
};

export const addAppointment = async (
  appointment: ZodCreateAppointment,
): Promise<ZodAppointment> => {
  assertNest();
  const appointmentData = {
    ...appointment,
    category_name: appointment.category_name || DEFAULT_CATEGORY,
    status: appointment.status || "booked",
  };

  const response = await nestOwnerFetch("appointments", {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });

  const payload = (await response.json()) as {
    data?: AppointmentRowLike;
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 409) {
      throw new BookingOverlapError(
        typeof payload.message === "string" ? payload.message : undefined,
      );
    }
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }

  if (!payload.data) {
    throw new Error("Не удалось создать запись: пустой ответ от сервера");
  }

  void syncAppointmentReminders(payload.data.id);

  return normalizeAppointment(payload.data);
};

export const deleteAppointment = async (
  id: string,
): Promise<ZodAppointment[]> => {
  assertNest();
  const response = await nestOwnerFetch(`appointments/${id}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as { data?: boolean; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  return [];
};

export const updateAppointment = async (
  id: string,
  updates: Partial<ZodCreateAppointment>,
): Promise<ZodAppointment> => {
  assertNest();
  const updatesData = {
    ...updates,
    ...(updates.category_name === undefined
      ? {}
      : { category_name: updates.category_name || DEFAULT_CATEGORY }),
    ...(updates.status === undefined ? {} : { status: updates.status || "booked" }),
  };

  const response = await nestOwnerFetch(`appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updatesData),
  });

  const payload = (await response.json()) as {
    data?: AppointmentRowLike;
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 409) {
      throw new BookingOverlapError(
        typeof payload.message === "string" ? payload.message : undefined,
      );
    }
    throw new Error(payload.message || (await nestErrorMessage(response)));
  }
  if (!payload.data) {
    throw new Error("Не удалось обновить запись: пустой ответ от сервера");
  }

  void syncAppointmentReminders(payload.data.id);

  return normalizeAppointment(payload.data);
};
