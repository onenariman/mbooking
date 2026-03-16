create table if not exists public.recommendation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  period_type text not null,
  period_from date not null,
  period_to date not null,
  status text not null default 'queued',
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  result_id uuid,
  error_code text,
  error_message text,
  model_name text,
  input_tokens integer,
  output_tokens integer,
  source_count integer,
  prompt_chars integer,
  duration_ms integer,
  constraint recommendation_jobs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed'))
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recommendation_jobs_result_id_fkey'
  ) then
    alter table public.recommendation_jobs
      add constraint recommendation_jobs_result_id_fkey
      foreign key (result_id) references public.ai_recommendations(id)
      on delete set null;
  end if;
end $$;

create index if not exists recommendation_jobs_user_status_requested_idx
  on public.recommendation_jobs (user_id, status, requested_at desc);

create index if not exists recommendation_jobs_user_period_idx
  on public.recommendation_jobs (user_id, period_type, period_from, period_to);

alter table public.recommendation_jobs enable row level security;

drop policy if exists "recommendation_jobs_owner_all" on public.recommendation_jobs;
create policy "recommendation_jobs_owner_all" on public.recommendation_jobs
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
