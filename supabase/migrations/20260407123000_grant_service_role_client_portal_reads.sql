begin;

grant usage on schema public to service_role;

grant select on table public.clients to service_role;
grant select on table public.appointments to service_role;
grant select on table public.client_discounts to service_role;

grant select, insert, update on table public.client_portal_invites to service_role;
grant select, insert, update on table public.client_portal_profiles to service_role;
grant select, insert, update on table public.client_portal_links to service_role;

commit;
