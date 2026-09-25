-- save_review: one call writes a lead's review and its issues atomically.
--
-- Without it, the app would insert the review and then the issues in separate
-- requests, and a failure in between leaves a review with half its tags. As a
-- function it is also the same boundary for every caller: the server action and
-- anyone hitting /rest/v1/rpc/save_review directly with a session cookie.
--
-- security invoker: it runs as the caller, so the RLS policies and column
-- grants from the authorization migration still apply to every statement. The
-- explicit checks below do not replace them; they turn "RLS said no" into
-- errors the app can tell apart:
--   P0002  the reply does not exist or the caller cannot see it
--   42501  the caller does not lead the reply's brand
--   22023  invalid input (score, comment, issue codes, critical issue with score > 2)
--
-- brand_id and reviewer_id are not parameters: brand_id comes from the reply
-- row and reviewer_id from auth.uid(). is_exemplar is left out until it has UI;
-- passing it on every save would reset a true value on edit.

create function public.save_review(
  p_reply_id    uuid,
  p_score       integer,
  p_comment     text,
  p_issue_codes text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_brand_id  uuid;
  v_review_id uuid;
  v_comment   text := btrim(coalesce(p_comment, ''));
  v_codes     text[] := coalesce(p_issue_codes, '{}');
begin
  if auth.uid() is null then
    raise exception 'Sign in to review replies.' using errcode = '42501';
  end if;

  -- Runs under replies_select: a reply of another brand is simply not found.
  select r.brand_id into v_brand_id from public.replies r where r.id = p_reply_id;
  if not found then
    raise exception 'Reply not found.' using errcode = 'P0002';
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
  values (p_reply_id, v_brand_id, auth.uid(), p_score, v_comment)
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
-- migration). Only a signed-in user may call this one.
grant execute on function public.save_review(uuid, integer, text, text[]) to authenticated;
