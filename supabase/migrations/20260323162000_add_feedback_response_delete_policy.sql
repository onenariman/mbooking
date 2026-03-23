alter table public.feedback_responses enable row level security;

drop policy if exists "feedback_responses_owner_delete" on public.feedback_responses;
create policy "feedback_responses_owner_delete" on public.feedback_responses
  as permissive
  for delete
  to authenticated
  using (auth.uid() = user_id);
