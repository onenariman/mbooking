import type { PushNotificationPayload } from "./push-send.service";

export type AppointmentPushEventType = "created" | "rescheduled" | "cancelled";

type Snapshot = {
  client_name: string;
  id: string;
  service_name: string;
};

export function buildAppointmentEventPayload(params: {
  appointment: Snapshot;
  appointmentLabel?: string | null;
  event: AppointmentPushEventType;
}): PushNotificationPayload {
  const { appointment, appointmentLabel, event } = params;
  const baseText = `${appointment.client_name} - ${appointment.service_name}`;

  if (event === "created") {
    return {
      body: appointmentLabel ? `${baseText}. ${appointmentLabel}` : baseText,
      requireInteraction: true,
      tag: `appointment-created-${appointment.id}`,
      title: "Новая запись",
    };
  }

  if (event === "rescheduled") {
    return {
      body: appointmentLabel
        ? `${baseText}. Новое время: ${appointmentLabel}`
        : baseText,
      requireInteraction: true,
      tag: `appointment-rescheduled-${appointment.id}`,
      title: "Запись перенесена",
    };
  }

  return {
    body: appointmentLabel ? `${baseText}. Было: ${appointmentLabel}` : baseText,
    requireInteraction: true,
    tag: `appointment-cancelled-${appointment.id}`,
    title: "Запись отменена",
  };
}
