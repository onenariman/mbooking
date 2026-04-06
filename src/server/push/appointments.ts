import { sendOwnerPushNotification } from "@/src/server/push/sendPush";
import { AppointmentPushEventType } from "@/src/lib/push/appointments";

type AppointmentPushSnapshot = {
  client_name: string;
  id: string;
  service_name: string;
};

const buildEventContent = ({
  appointment,
  appointmentLabel,
  event,
}: {
  appointment: AppointmentPushSnapshot;
  appointmentLabel?: string | null;
  event: AppointmentPushEventType;
}) => {
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
};

export const sendOwnerAppointmentEventPush = async ({
  appointment,
  appointmentLabel,
  event,
  ownerUserId,
}: {
  appointment: AppointmentPushSnapshot;
  appointmentLabel?: string | null;
  event: AppointmentPushEventType;
  ownerUserId: string;
}) => {
  const payload = buildEventContent({
    appointment,
    appointmentLabel,
    event,
  });

  return sendOwnerPushNotification({
    ownerUserId,
    payload: {
      ...payload,
      url: "/receptions",
    },
  });
};
