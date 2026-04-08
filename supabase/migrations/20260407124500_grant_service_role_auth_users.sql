begin;

grant usage on schema auth to service_role;
grant select on table auth.users to service_role;

commit;
