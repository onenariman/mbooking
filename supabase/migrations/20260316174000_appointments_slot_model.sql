-- Ensure a single, documented slot uniqueness model

alter table public.appointments
  drop constraint if exists appointments_client_user_service_time_unique;

alter table public.appointments
  drop constraint if exists appointments_user_slot_service_unique,
  drop constraint if exists appointments_user_service_time_unique;

drop index if exists public.appointments_client_user_service_time_unique;
drop index if exists public.appointments_user_slot_service_unique;
drop index if exists public.appointments_user_service_time_unique;

alter table public.appointments
  add constraint appointments_user_service_time_unique
    unique (user_id, appointment_at, service_name);

-- Remove legacy archive RPC (feature deprecated)
drop function if exists public.archive_unconfirmed_appointments(interval);
