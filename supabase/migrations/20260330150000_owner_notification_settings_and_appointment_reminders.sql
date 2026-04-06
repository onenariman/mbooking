begin;

create table if not exists public.owner_notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_offsets_minutes integer[] not null default array[60, 5],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.owner_notification_settings enable row level security;

drop policy if exists "owner_notification_settings_self_access" on public.owner_notification_settings;
create policy "owner_notification_settings_self_access" on public.owner_notification_settings
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  offset_minutes integer not null,
  remind_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'cancelled')),
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appointment_id, offset_minutes)
);

alter table public.appointment_reminders enable row level security;

drop policy if exists "appointment_reminders_owner_access" on public.appointment_reminders;
create policy "appointment_reminders_owner_access" on public.appointment_reminders
  as permissive
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_appointment_reminders_pending_due
  on public.appointment_reminders (status, remind_at)
  where status = 'pending';

create index if not exists idx_appointment_reminders_user_status
  on public.appointment_reminders (user_id, status, remind_at desc);

commit;
