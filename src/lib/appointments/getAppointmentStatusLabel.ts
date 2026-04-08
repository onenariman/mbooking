import type { ZodAppointmentStatus } from "@/src/schemas/books/bookSchema";

const appointmentStatusLabels: Record<ZodAppointmentStatus, string> = {
  booked: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
  no_show: "Не пришел",
};

export function getAppointmentStatusLabel(status: ZodAppointmentStatus): string {
  return appointmentStatusLabels[status] ?? status;
}
