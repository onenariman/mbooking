alter table public.ai_recommendations
  add column if not exists prompt_id_snapshot uuid;

alter table public.ai_recommendations
  add column if not exists prompt_name_snapshot text;

update public.ai_recommendations
set prompt_id_snapshot = prompt_id
where prompt_id is not null
  and prompt_id_snapshot is null;

update public.ai_recommendations as ar
set prompt_name_snapshot = rp.name
from public.recommendation_prompts as rp
where ar.prompt_id = rp.id
  and ar.prompt_name_snapshot is null;

update public.ai_recommendations
set prompt_name_snapshot = 'Системный'
where prompt_id is null
  and prompt_name_snapshot is null;

update public.ai_recommendations
set prompt_name_snapshot = 'Пользовательский промпт'
where prompt_id is not null
  and prompt_name_snapshot is null;
