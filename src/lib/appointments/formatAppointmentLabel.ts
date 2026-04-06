import { format } from "date-fns";
import { ru } from "date-fns/locale";

export const formatAppointmentLabel = (
  appointmentAt: string | null | undefined,
  appointmentEnd?: string | null,
) => {
  if (!appointmentAt) {
    return null;
  }

  const startDate = new Date(appointmentAt);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  if (!appointmentEnd) {
    return format(startDate, "dd MMMM HH:mm", { locale: ru });
  }

  const endDate = new Date(appointmentEnd);
  if (Number.isNaN(endDate.getTime())) {
    return format(startDate, "dd MMMM HH:mm", { locale: ru });
  }

  const sameDay = startDate.toDateString() === endDate.toDateString();
  const datePart = format(startDate, "dd MMMM", { locale: ru });
  const startTime = format(startDate, "HH:mm", { locale: ru });
  const endTime = format(endDate, "HH:mm", { locale: ru });

  if (sameDay) {
    return `${datePart} ${startTime} - ${endTime}`;
  }

  const endDatePart = format(endDate, "dd MMMM", { locale: ru });
  return `${datePart} ${startTime} - ${endDatePart} ${endTime}`;
};
