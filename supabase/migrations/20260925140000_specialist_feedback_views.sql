-- Specialist feedback at helpdesk volume (TASK-005, Q14–Q17).
--
-- /me paginates the reviewed replies, so its per-brand numbers can no longer
-- be computed from the rows on screen. These views compute them in Postgres.
-- All three are security_invoker: they run with the caller's privileges, so
-- RLS on replies, reviews and review_issues applies exactly as it does to a
-- direct select. Without it a view runs as its owner and bypasses RLS.
--
-- The views do not filter by person. RLS lets a lead see every reply of their
-- brand, so /me always adds specialist_id = the session user. TASK-006 reads
-- the same views per brand for the specialist table and the frequent issues.

-- One row per reviewed reply, with every issue flagged on it by any review.
-- The feed for /me: filter by specialist, brand, issue and text, then page.
create view public.reviewed_replies
with (security_invoker = on) as
select
  rp.id,
  rp.brand_id,
  rp.specialist_id,
  rp.ticket_ref,
  rp.subject,
  rp.sent_at,
  array(
    select distinct ri.issue_code
    from public.reviews rv
    join public.review_issues ri on ri.review_id = rv.id
    where rv.reply_id = rp.id
    order by ri.issue_code
  ) as issue_codes
from public.replies rp
where exists (select 1 from public.reviews rv where rv.reply_id = rp.id);

-- Per specialist and brand. Every review counts once, as it will in the brand
-- trend; a review is critical when any of its issues is.
create view public.specialist_brand_scores
with (security_invoker = on) as
select
  rp.specialist_id,
  rp.brand_id,
  round(avg(rv.score), 2) as avg_score,
  count(*) as review_count,
  count(*) filter (where exists (
    select 1
    from public.review_issues ri
    join public.issue_types it on it.code = ri.issue_code
    where ri.review_id = rv.id and it.severity = 'critical'
  )) as critical_count
from public.reviews rv
join public.replies rp on rp.id = rv.reply_id
group by rp.specialist_id, rp.brand_id;

-- Per specialist, brand and issue: how often it was flagged and the sent_at
-- of the latest reply it was flagged on (when the work happened, not when it
-- was reviewed), which is what answers "did it stop?".
create view public.specialist_issue_counts
with (security_invoker = on) as
select
  rp.specialist_id,
  rp.brand_id,
  ri.issue_code,
  count(*) as flagged_count,
  max(rp.sent_at) as last_sent_at
from public.review_issues ri
join public.reviews rv on rv.id = ri.review_id
join public.replies rp on rp.id = rv.reply_id
group by rp.specialist_id, rp.brand_id, ri.issue_code;

-- Read-only for signed-in users. The default privileges from the authorization
-- migration already keep anon out; this states it where the views are made.
revoke all on public.reviewed_replies, public.specialist_brand_scores, public.specialist_issue_counts
  from anon, authenticated;
grant select on public.reviewed_replies, public.specialist_brand_scores, public.specialist_issue_counts
  to authenticated;

-- The feed filters by specialist and orders by sent_at. The composite index
-- serves both, and its leading column still serves plain specialist_id lookups
-- (the replies_select policy), so the single-column index is redundant.
create index replies_specialist_id_sent_at_idx on public.replies (specialist_id, sent_at desc);
drop index public.replies_specialist_id_idx;
