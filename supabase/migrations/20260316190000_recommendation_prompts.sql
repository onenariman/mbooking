-- User-managed recommendation prompts (no categories for MVP)

create table if not exists public.recommendation_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recommendation_prompts_user_default_idx
  on public.recommendation_prompts (user_id, is_default, created_at desc);

alter table public.recommendation_prompts enable row level security;

drop policy if exists "recommendation_prompts_owner_all" on public.recommendation_prompts;
create policy "recommendation_prompts_owner_all" on public.recommendation_prompts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.recommendation_jobs
  add column if not exists prompt_id uuid;

alter table public.recommendation_jobs
  drop constraint if exists recommendation_jobs_prompt_id_fkey;

alter table public.recommendation_jobs
  add constraint recommendation_jobs_prompt_id_fkey
  foreign key (prompt_id) references public.recommendation_prompts(id)
  on delete set null;

alter table public.ai_recommendations
  add column if not exists prompt_id uuid;

alter table public.ai_recommendations
  drop constraint if exists ai_recommendations_prompt_id_fkey;

alter table public.ai_recommendations
  add constraint ai_recommendations_prompt_id_fkey
  foreign key (prompt_id) references public.recommendation_prompts(id)
  on delete set null;

alter table public.ai_recommendations
  add column if not exists prompt_snapshot text;
