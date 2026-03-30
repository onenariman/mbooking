-- P0/P2 foundation:
-- feedback token linkage, discounts, push subscriptions, client portal profiles/links/invites

begin;

-- ---------------------------------------------------------------------------
-- feedback_tokens -> appointments
-- ---------------------------------------------------------------------------

alter table public.feedback_tokens
  add column if not exists appointment_id uuid
    references public.appointments(id) on delete set null;

create index if not exists idx_feedback_tokens_appointment_id
  on public.feedback_tokens (appointment_id);

-- ---------------------------------------------------------------------------
-- push_subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  audience text not null check (audience in ('owner', 'client')),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (auth_user_id, owner_user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_self_access" on public.push_subscriptions;
create policy "push_subscriptions_self_access" on public.push_subscriptions
  as permissive
  for all
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

create index if not exists idx_push_subscriptions_owner_audience
  on public.push_subscriptions (owner_user_id, audience, created_at desc);

create index if not exists idx_push_subscriptions_auth_user
  on public.push_subscriptions (auth_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- client_discounts
-- ---------------------------------------------------------------------------

create table if not exists public.client_discounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_phone text not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  feedback_token text not null,
  discount_percent integer not null default 5
    check (discount_percent between 1 and 100),
  is_used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.client_discounts enable row level security;

drop policy if exists "client_discounts_owner_access" on public.client_discounts;
create policy "client_discounts_owner_access" on public.client_discounts
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists idx_client_discounts_feedback_token_unique
  on public.client_discounts (feedback_token);

create index if not exists idx_client_discounts_user_phone_active
  on public.client_discounts (user_id, client_phone, is_used, created_at desc);

-- ---------------------------------------------------------------------------
-- discount_rules
-- ---------------------------------------------------------------------------

create table if not exists public.discount_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discount_percent integer not null default 5
    check (discount_percent between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.discount_rules enable row level security;

drop policy if exists "discount_rules_owner_access" on public.discount_rules;
create policy "discount_rules_owner_access" on public.discount_rules
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists idx_discount_rules_one_active_per_user
  on public.discount_rules (user_id)
  where is_active = true;

create index if not exists idx_discount_rules_user_created_at
  on public.discount_rules (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- client_portal_profiles
-- ---------------------------------------------------------------------------

create table if not exists public.client_portal_profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  display_name text,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.client_portal_profiles enable row level security;

drop policy if exists "client_portal_profiles_self_access" on public.client_portal_profiles;
create policy "client_portal_profiles_self_access" on public.client_portal_profiles
  as permissive
  for all
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ---------------------------------------------------------------------------
-- client_portal_links
-- ---------------------------------------------------------------------------

create table if not exists public.client_portal_links (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  client_auth_user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_phone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

alter table public.client_portal_links enable row level security;

drop policy if exists "client_portal_links_access" on public.client_portal_links;
create policy "client_portal_links_access" on public.client_portal_links
  as permissive
  for all
  to authenticated
  using (
    auth.uid() = client_auth_user_id
    or auth.uid() = owner_user_id
  )
  with check (
    auth.uid() = client_auth_user_id
    or auth.uid() = owner_user_id
  );

create unique index if not exists idx_client_portal_links_owner_client_auth
  on public.client_portal_links (owner_user_id, client_auth_user_id);

create unique index if not exists idx_client_portal_links_owner_phone
  on public.client_portal_links (owner_user_id, client_phone);

create index if not exists idx_client_portal_links_client_auth
  on public.client_portal_links (client_auth_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- client_portal_invites
-- ---------------------------------------------------------------------------

create table if not exists public.client_portal_invites (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  client_phone text not null,
  token_hash text not null unique,
  purpose text not null check (purpose in ('activation', 'password_reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade
);

alter table public.client_portal_invites enable row level security;

drop policy if exists "client_portal_invites_owner_access" on public.client_portal_invites;
create policy "client_portal_invites_owner_access" on public.client_portal_invites
  as permissive
  for all
  to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create index if not exists idx_client_portal_invites_owner_phone_active
  on public.client_portal_invites (owner_user_id, client_phone, expires_at)
  where used_at is null;

create index if not exists idx_client_portal_invites_owner_purpose_active
  on public.client_portal_invites (owner_user_id, purpose, expires_at)
  where used_at is null;

commit;
