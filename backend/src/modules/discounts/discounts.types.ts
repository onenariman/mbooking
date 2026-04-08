import type { ClientDiscount } from "@prisma/client";

export type DiscountResponse = {
  id: string;
  user_id: string;
  client_phone: string;
  appointment_id: string | null;
  expires_at: string | null;
  feedback_token: string | null;
  discount_percent: number;
  is_used: boolean;
  note: string | null;
  reserved_at: string | null;
  reserved_for_appointment_id: string | null;
  service_id: string | null;
  service_name_snapshot: string | null;
  source_type: "feedback" | "manual";
  used_at: string | null;
  used_on_appointment_id: string | null;
  created_at: string;
};

export function toDiscountResponse(row: ClientDiscount): DiscountResponse {
  return {
    id: row.id,
    user_id: row.userId,
    client_phone: row.clientPhone,
    appointment_id: row.appointmentId,
    expires_at: row.expiresAt?.toISOString() ?? null,
    feedback_token: row.feedbackToken,
    discount_percent: row.discountPercent,
    is_used: row.isUsed,
    note: row.note,
    reserved_at: row.reservedAt?.toISOString() ?? null,
    reserved_for_appointment_id: row.reservedForAppointmentId,
    service_id: row.serviceId,
    service_name_snapshot: row.serviceNameSnapshot,
    source_type: row.sourceType === "feedback" ? "feedback" : "manual",
    used_at: row.usedAt?.toISOString() ?? null,
    used_on_appointment_id: row.usedOnAppointmentId,
    created_at: row.createdAt.toISOString(),
  };
}
