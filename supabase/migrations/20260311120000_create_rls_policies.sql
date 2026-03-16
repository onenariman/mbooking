-- Ensure RLS is enabled and policies are defined in migrations.

alter table public.ai_recommendations enable row level security;
alter table public.appointments enable row level security;
alter table public.categories enable row level security;
alter table public.clients enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.feedback_tokens enable row level security;
alter table public.services enable row level security;

drop policy if exists "ai_recommendations_owner_all" on public.ai_recommendations;
create policy "ai_recommendations_owner_all" on public.ai_recommendations
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "appointments policy" on public.appointments;
create policy "appointments policy" on public.appointments
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "categories" on public.categories;
create policy "categories" on public.categories
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "clients" on public.clients;
create policy "clients" on public.clients
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "feedback_responses_owner_select" on public.feedback_responses;
create policy "feedback_responses_owner_select" on public.feedback_responses
  as permissive
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "feedback_tokens_owner_all" on public.feedback_tokens;
create policy "feedback_tokens_owner_all" on public.feedback_tokens
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "services  policy" on public.services;
create policy "services  policy" on public.services
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
