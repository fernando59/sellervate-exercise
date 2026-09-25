-- The brand trend (TASK-006): the weekly average score of a brand.
--
-- security_invoker: the view runs with the caller's privileges, so RLS on
-- replies, reviews and review_issues applies. A lead gets the whole brand; a
-- specialist querying it gets only their own replies, never a team average.
-- Without it the view would run as its owner and bypass RLS.
--
-- The week is the week the reply was SENT (when the work was done), not when
-- it was reviewed, or the chart would measure when the lead reads. Weeks start
-- on Monday in Europe/Madrid, the time zone the app measures "yesterday" in
-- (apps/web/server/time.ts); a per-brand time zone would change both places.
-- The cast goes through a local timestamp: truncating the timestamptz and then
-- casting to date would read the Madrid midnight in UTC and land on Sunday.
--
-- Every review counts once, as in specialist_brand_scores; a review is
-- critical when any of its issues is. Weeks without reviews have no row: the
-- app draws them as gaps, never as zeros.
create view public.brand_weekly_scores
with (security_invoker = on) as
select
  rp.brand_id,
  date_trunc('week', rp.sent_at at time zone 'Europe/Madrid')::date as week,
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
group by rp.brand_id, date_trunc('week', rp.sent_at at time zone 'Europe/Madrid')::date;

-- Read-only for signed-in users, like the specialist views.
revoke all on public.brand_weekly_scores from anon, authenticated;
grant select on public.brand_weekly_scores to authenticated;
