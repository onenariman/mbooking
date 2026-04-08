import { nestOwnerFetch } from "@/src/utils/api/nestOwnerApi";

export type AppointmentPushEventType = "created" | "rescheduled" | "cancelled";

export const notifyAppointmentPushEvent = async ({
  appointmentId,
  appointmentLabel,
  event,
}: {
  appointmentId: string;
  appointmentLabel?: string | null;
  event: AppointmentPushEventType;
}) => {
  try {
    const response = await nestOwnerFetch("push/appointments/event", {
      method: "POST",
      body: JSON.stringify({
        appointment_id: appointmentId,
        appointment_label: appointmentLabel ?? null,
        event,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      console.error(
        "Failed to send appointment push event:",
        payload?.message || response.statusText,
      );
    }
  } catch (error) {
    console.error("Failed to send appointment push event:", error);
  }
};
