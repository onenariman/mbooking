create or replace function public.cleanup_recommendation_jobs(
  retention interval default '30 days'
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  deleted_count integer;
begin
  delete from public.recommendation_jobs
   where status in ('succeeded', 'failed')
     and coalesce(finished_at, requested_at) < now() - retention;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (
      select 1 from cron.job where jobname = 'cleanup_recommendation_jobs_daily'
    ) then
      perform cron.schedule(
        'cleanup_recommendation_jobs_daily',
        '0 3 * * *',
        $cron$select public.cleanup_recommendation_jobs('30 days');$cron$
      );
    end if;
  end if;
end $$;
