-- Add rating fields for anonymous feedback
alter table public.feedback_responses
  add column if not exists score_result smallint,
  add column if not exists score_explanation smallint,
  add column if not exists score_comfort smallint,
  add column if not exists score_booking smallint,
  add column if not exists score_recommendation smallint;

alter table public.feedback_responses
  add constraint feedback_responses_score_result_check
    check (score_result between 1 and 5),
  add constraint feedback_responses_score_explanation_check
    check (score_explanation between 1 and 5),
  add constraint feedback_responses_score_comfort_check
    check (score_comfort between 1 and 5),
  add constraint feedback_responses_score_booking_check
    check (score_booking between 1 and 5),
  add constraint feedback_responses_score_recommendation_check
    check (score_recommendation between 1 and 5);

-- Replace submit_feedback RPC to include scores
drop function if exists public.submit_feedback(text, text);

create or replace function public.submit_feedback(
  p_token text,
  p_feedback_text text,
  p_score_result smallint default null,
  p_score_explanation smallint default null,
  p_score_comfort smallint default null,
  p_score_booking smallint default null,
  p_score_recommendation smallint default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token feedback_tokens%rowtype;
  v_response_id uuid;
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

  return v_response_id::text;
end;
$$;

grant execute on function public.submit_feedback(
  text,
  text,
  smallint,
  smallint,
  smallint,
  smallint,
  smallint
) to anon, authenticated;
