-- Align RLS policies with authenticated role only

alter policy "appointments policy" on public.appointments
  to authenticated;

alter policy "categories" on public.categories
  to authenticated;

alter policy "clients" on public.clients
  to authenticated;

alter policy "services  policy" on public.services
  to authenticated;

-- Simplify and standardize unique constraints for appointment slots

alter table public.appointments
  drop constraint if exists appointments_client_user_service_time_unique;

alter table public.appointments
  drop constraint if exists appointments_user_slot_service_unique,
  drop constraint if exists appointments_user_service_time_unique;

alter table public.appointments
  add constraint appointments_user_service_time_unique
    unique (user_id, appointment_at, service_name);

-- Helpful indexes for common filters and RLS predicates

create index if not exists idx_appointments_user_appointment_at
  on public.appointments (user_id, appointment_at);

create index if not exists idx_feedback_responses_user_created_at
  on public.feedback_responses (user_id, created_at);

create index if not exists idx_feedback_responses_user_period_bucket
  on public.feedback_responses (user_id, period_bucket);

create index if not exists idx_ai_recommendations_user_period
  on public.ai_recommendations (user_id, period_type, period_from, period_to);

-- Ensure create_feedback_token RPC is defined in migrations

create or replace function public.create_feedback_token(
  p_expires_in interval default '14 days'::interval
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');

  insert into public.feedback_tokens(user_id, token, expires_at)
  values (v_user_id, v_token, now() + p_expires_in);

  return v_token;
end;
$$;

revoke all on function public.create_feedback_token(interval) from public;
grant execute on function public.create_feedback_token(interval) to authenticated;

-- Drop legacy archive function that does not match current schema

drop function if exists public.archive_unconfirmed_appointments(interval);

