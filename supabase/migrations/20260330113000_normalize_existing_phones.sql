begin;

create or replace function pg_temp.normalize_phone(value text)
returns text
language sql
immutable
as $$
  with digits as (
    select regexp_replace(coalesce(value, ''), '\D', '', 'g') as clean
  )
  select case
    when clean ~ '^\d{10}$' then '7' || clean
    when clean ~ '^8\d{10}$' then '7' || substring(clean from 2)
    when clean ~ '^7\d{10}$' then clean
    else null
  end
  from digits;
$$;

update public.clients
set phone = pg_temp.normalize_phone(phone)
where pg_temp.normalize_phone(phone) is not null
  and phone is distinct from pg_temp.normalize_phone(phone);

update public.appointments
set client_phone = pg_temp.normalize_phone(client_phone)
where pg_temp.normalize_phone(client_phone) is not null
  and client_phone is distinct from pg_temp.normalize_phone(client_phone);

update public.client_discounts
set client_phone = pg_temp.normalize_phone(client_phone)
where pg_temp.normalize_phone(client_phone) is not null
  and client_phone is distinct from pg_temp.normalize_phone(client_phone);

commit;
