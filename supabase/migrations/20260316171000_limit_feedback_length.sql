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

  return v_response_id::text;
end;
$function$;
