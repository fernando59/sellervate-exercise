-- save_review: the only way the app writes a review.
--
-- One call writes a lead's review and its issues in one transaction, so a
-- failure cannot leave a review with half its tags. It is also the single
-- write path: authenticated loses direct insert/update on reviews and
-- insert/delete on review_issues below. Before that, a lead could POST to
-- /rest/v1/reviews and /rest/v1/review_issues and skip the rules that only
-- this function knows (the critical-issue cap), which would also hold for a
-- future importer. The comment length moves into a check constraint too.
--
-- security definer, because the caller no longer has the table privileges.
-- RLS does not apply inside, so every rule the policies enforced is checked
-- explicitly, and each failure has its own code the app can tell apart:
--   PT404  the reply does not exist, or the caller neither leads its brand
--          nor wrote it (a lead of another brand cannot learn it exists).
--          PostgREST answers a PTxyz code with HTTP xyz, so a direct API
--          call gets a 404, not the 500 an unmapped P0002 would give.
--   42501  no session, or the caller can see the reply but does not lead it
--   22023  invalid input (score, comment, issue codes, critical issue with score > 2)
--
-- brand_id and reviewer_id are not parameters: brand_id comes from the reply
-- row and reviewer_id from auth.uid(). is_exemplar is left out until it has UI;
-- passing it on every save would reset a true value on edit.

alter table public.reviews
  add constraint reviews_comment_length check (char_length(comment) <= 2000);

-- The write policies from the authorization migration stay: if a later
-- migration grants these privileges back, RLS still limits the damage.
revoke insert, update on public.reviews from authenticated;
revoke insert, delete on public.review_issues from authenticated;

-- Who may see a reply, in one place. replies_select and save_review both use
-- it: save_review runs as definer, so RLS does not apply inside and it has to
-- ask the same question itself. A copy of the rule there would drift the day
-- the policy changes.
create function private.can_see_reply(p_specialist_id uuid, p_brand_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_specialist_id = (select auth.uid()) or private.is_lead_of(p_brand_id);
$$;

revoke execute on function private.can_see_reply(uuid, uuid) from public, anon;
grant execute on function private.can_see_reply(uuid, uuid) to authenticated;

alter policy replies_select on public.replies
  using (private.can_see_reply(specialist_id, brand_id));

create function public.save_review(
  p_reply_id    uuid,
  p_score       integer,
  p_comment     text,
  p_issue_codes text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid           uuid := auth.uid();
  v_brand_id      uuid;
  v_specialist_id uuid;
  v_review_id     uuid;
  v_comment       text := btrim(coalesce(p_comment, ''));
  v_codes         text[] := coalesce(p_issue_codes, '{}');
begin
  if v_uid is null then
    raise exception 'Sign in to review replies.' using errcode = '42501';
  end if;

  select r.brand_id, r.specialist_id into v_brand_id, v_specialist_id
  from public.replies r where r.id = p_reply_id;

  -- The same rule as replies_select, from the same function.
  if not found or not private.can_see_reply(v_specialist_id, v_brand_id) then
    raise exception 'Reply not found.' using errcode = 'PT404';
  end if;

  if not private.is_lead_of(v_brand_id) then
    raise exception 'Only a lead of this brand can review this reply.' using errcode = '42501';
  end if;

  if p_score is null or p_score not between 1 and 5 then
    raise exception 'Score must be between 1 and 5.' using errcode = '22023';
  end if;

  if length(v_comment) > 2000 then
    raise exception 'Comment must be 2000 characters or fewer.' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(v_codes) as c(code)
    where not exists (select 1 from public.issue_types it where it.code = c.code and it.active)
  ) then
    raise exception 'Unknown or retired issue type.' using errcode = '22023';
  end if;

  -- Severity never computes the score, but a critical issue caps it: "wrong
  -- information about the product" cannot sit next to a 4.
  if p_score > 2 and exists (
    select 1 from public.issue_types it where it.code = any (v_codes) and it.severity = 'critical'
  ) then
    raise exception 'A critical issue caps the score at 2.' using errcode = '22023';
  end if;

  insert into public.reviews (reply_id, brand_id, reviewer_id, score, comment)
  values (p_reply_id, v_brand_id, v_uid, p_score, v_comment)
  on conflict (reply_id, reviewer_id)
    do update set score = excluded.score, comment = excluded.comment
  returning id into v_review_id;

  -- Replace the issues by difference, so unchanged tags keep their rows.
  delete from public.review_issues ri
  where ri.review_id = v_review_id and ri.issue_code <> all (v_codes);

  insert into public.review_issues (review_id, issue_code)
  select distinct v_review_id, c.code from unnest(v_codes) as c(code)
  on conflict do nothing;

  return v_review_id;
end;
$$;

-- New functions are not executable by anyone by default (authorization
-- migration). The revoke repeats it here, so a security definer function does
-- not depend on those defaults staying in place. Only a signed-in user may call it.
revoke execute on function public.save_review(uuid, integer, text, text[]) from public, anon;
grant execute on function public.save_review(uuid, integer, text, text[]) to authenticated;
