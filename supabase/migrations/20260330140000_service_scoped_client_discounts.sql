begin;

alter table public.appointments
  add column if not exists service_id uuid
    references public.services(id) on delete set null;

create index if not exists idx_appointments_service_id
  on public.appointments (service_id)
  where service_id is not null;

update public.appointments as a
set service_id = s.id
from public.services as s
where a.service_id is null
  and a.user_id = s.user_id
  and a.service_name = s.name;

alter table public.client_discounts
  add column if not exists service_id uuid
    references public.services(id) on delete set null,
  add column if not exists service_name_snapshot text;

create index if not exists idx_client_discounts_service_id
  on public.client_discounts (service_id)
  where service_id is not null;

drop index if exists public.idx_client_discounts_user_phone_active;

create index if not exists idx_client_discounts_user_phone_service_active
  on public.client_discounts (user_id, client_phone, service_id, is_used, created_at desc);

update public.client_discounts as cd
set
  service_id = a.service_id,
  service_name_snapshot = coalesce(cd.service_name_snapshot, a.service_name)
from public.appointments as a
where cd.appointment_id = a.id
  and (
    cd.service_id is null
    or cd.service_name_snapshot is null
  );

update public.client_discounts as cd
set service_name_snapshot = s.name
from public.services as s
where cd.service_id = s.id
  and cd.service_name_snapshot is null;

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
          source_type,
          service_id,
          service_name_snapshot
        ) values (
          v_token.user_id,
          v_client_phone,
          v_appointment.id,
          v_token.token,
          v_discount_percent,
          'feedback',
          v_appointment.service_id,
          v_appointment.service_name
        )
        on conflict (feedback_token) do update
          set client_phone = excluded.client_phone,
              appointment_id = excluded.appointment_id,
              discount_percent = excluded.discount_percent,
              source_type = excluded.source_type,
              service_id = excluded.service_id,
              service_name_snapshot = excluded.service_name_snapshot;
      end if;
    end if;
  end if;

  return v_response_id::text;
end;
$function$;

commit;
