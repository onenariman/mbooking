-- Composite indexes for common filters and RLS predicates.

create index if not exists idx_appointments_user_appointment_at
  on public.appointments (user_id, appointment_at);

create index if not exists idx_feedback_responses_user_period_bucket
  on public.feedback_responses (user_id, period_bucket);
