-- Prevent exact slot collisions per specialist and service at DB level.
-- This keeps frontend validation as UX only while PostgreSQL remains authoritative.

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_user_slot_service_unique
  UNIQUE (user_id, appointment_at, service_name);
