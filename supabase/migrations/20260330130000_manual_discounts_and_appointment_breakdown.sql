begin;

alter table public.client_discounts
  alter column feedback_token drop not null;

alter table public.client_discounts
  add column if not exists source_type text not null default 'feedback'
    check (source_type in ('feedback', 'manual')),
  add column if not exists note text,
  add column if not exists expires_at timestamptz,
  add column if not exists reserved_for_appointment_id uuid
    references public.appointments(id) on delete set null,
  add column if not exists reserved_at timestamptz,
  add column if not exists used_on_appointment_id uuid
    references public.appointments(id) on delete set null;

update public.client_discounts
set source_type = 'feedback'
where source_type is distinct from 'feedback'
  and feedback_token is not null;

update public.client_discounts
set used_on_appointment_id = appointment_id
where is_used = true
  and used_on_appointment_id is null
  and appointment_id is not null;

drop index if exists public.idx_client_discounts_feedback_token_unique;

create unique index if not exists idx_client_discounts_feedback_token_unique
  on public.client_discounts (feedback_token)
  where feedback_token is not null;

create index if not exists idx_client_discounts_reserved_for_appointment
  on public.client_discounts (reserved_for_appointment_id)
  where reserved_for_appointment_id is not null;

create index if not exists idx_client_discounts_used_on_appointment
  on public.client_discounts (used_on_appointment_id)
  where used_on_appointment_id is not null;

create index if not exists idx_client_discounts_expires_at_active
  on public.client_discounts (expires_at)
  where expires_at is not null and is_used = false;

alter table public.appointments
  add column if not exists applied_discount_id uuid
    references public.client_discounts(id) on delete set null,
  add column if not exists service_amount numeric,
  add column if not exists extra_amount numeric,
  add column if not exists discount_amount numeric;

create index if not exists idx_appointments_applied_discount_id
  on public.appointments (applied_discount_id)
  where applied_discount_id is not null;

create or replace function public.submit_feedback(
  p_token text,
  p_feedback_text text,
  p_score_result smallint default null,
  p_score_explanation smallint default null,
  p_score_comfort smallint default null,
  p_score_booking smallint default null,
  p_score_recommendation smallint default null
)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_token feedback_tokens%rowtype;
  v_response_id uuid;
  v_appointment appointments%rowtype;
  v_discount_percent integer := 5;
  v_client_phone text;
begin
  select *
    into v_token
    from feedback_tokens
   where token = p_token
     and is_active = true
     and expires_at > now()
     and used_at is null
   limit 1;

  if v_token.id is null then
    raise exception 'Invalid or expired token';
  end if;

  if char_length(coalesce(p_feedback_text, '')) > 1000 then
    raise exception 'Feedback text too long';
  end if;

  insert into feedback_responses (
    user_id,
    feedback_text,
    score_result,
    score_explanation,
    score_comfort,
    score_booking,
    score_recommendation
  ) values (
    v_token.user_id,
    p_feedback_text,
    p_score_result,
    p_score_explanation,
    p_score_comfort,
    p_score_booking,
    p_score_recommendation
  )
  returning id into v_response_id;

  update feedback_tokens
     set is_active = false,
         used_at = now()
   where id = v_token.id;

  if v_token.appointment_id is not null then
    select *
      into v_appointment
      from appointments
     where id = v_token.appointment_id
     limit 1;

    if v_appointment.id is not null then
      v_client_phone := regexp_replace(coalesce(v_appointment.client_phone, ''), '\D', '', 'g');

      if v_client_phone ~ '^\d{10}$' then
        v_client_phone := '7' || v_client_phone;
      elsif v_client_phone ~ '^8\d{10}$' then
        v_client_phone := '7' || substring(v_client_phone from 2);
      elsif v_client_phone ~ '^7\d{10}$' then
        v_client_phone := v_client_phone;
      else
        v_client_phone := null;
      end if;

      if v_client_phone is not null then
        select discount_percent
          into v_discount_percent
          from discount_rules
         where user_id = v_token.user_id
           and is_active = true
         order by created_at desc
         limit 1;

        v_discount_percent := coalesce(v_discount_percent, 5);

        insert into client_discounts (
          user_id,
          client_phone,
          appointment_id,
          feedback_token,
          discount_percent,
          source_type
        ) values (
          v_token.user_id,
          v_client_phone,
          v_appointment.id,
          v_token.token,
          v_discount_percent,
          'feedback'
        )
        on conflict (feedback_token) do update
          set client_phone = excluded.client_phone,
              appointment_id = excluded.appointment_id,
              discount_percent = excluded.discount_percent,
              source_type = excluded.source_type;
      end if;
    end if;
  end if;

  return v_response_id::text;
end;
$function$;

commit;
