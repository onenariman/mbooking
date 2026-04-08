import type { Appointment } from "@prisma/client";

export type AppointmentResponse = {
  id: string;
  created_at: string;
  user_id: string;
  applied_discount_id: string | null;
  client_name: string;
  client_phone: string;
  service_id: string | null;
  service_name: string;
  category_name: string;
  appointment_at: string | null;
  appointment_end: string | null;
  status: "booked" | "completed" | "cancelled" | "no_show";
  amount: number | null;
  service_amount: number | null;
  extra_amount: number | null;
  discount_amount: number | null;
  notes: string | null;
};

export function toAppointmentResponse(
  appointment: Appointment,
): AppointmentResponse {
  return {
    id: appointment.id,
    created_at: appointment.createdAt.toISOString(),
    user_id: appointment.userId,
    applied_discount_id: appointment.appliedDiscountId,
    client_name: appointment.clientName,
    client_phone: appointment.clientPhone,
    service_id: appointment.serviceId,
    service_name: appointment.serviceName,
    category_name: appointment.categoryName,
    appointment_at: appointment.appointmentAt?.toISOString() ?? null,
    appointment_end: appointment.appointmentEnd?.toISOString() ?? null,
    status: appointment.status,
    amount: appointment.amount === null ? null : Number(appointment.amount),
    service_amount:
      appointment.serviceAmount === null ? null : Number(appointment.serviceAmount),
    extra_amount:
      appointment.extraAmount === null ? null : Number(appointment.extraAmount),
    discount_amount:
      appointment.discountAmount === null
        ? null
        : Number(appointment.discountAmount),
    notes: appointment.notes,
  };
}
