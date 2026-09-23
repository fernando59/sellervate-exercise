-- Authorization: who can read and write what, enforced by Postgres.
--
-- The brand is the tenant and the role lives on brand_memberships, so every rule
-- below is "is the caller a member / the lead of this row's brand". The app also
-- checks membership in server/auth to answer 403 instead of an empty list; these
-- policies are the guarantee underneath, and they hold for any client that
-- reaches PostgREST with a user JWT, not only for the Next app.
--
-- Matrix (docs/PLAN.md § 3, TASK-003 grill Q4 and Q5):
--   brands             members of the brand
--   brand_memberships  your own rows, plus every row of the brands you lead
--   profiles           yourself, plus anyone who shares a brand with you
--   replies            the author, plus the leads of the reply's brand
--   reviews            the leads of the brand, plus the author of the reviewed reply
--   review_issues      whoever can read the parent review
--   issue_types        any signed-in user (global catalog, no tenant data)
--   brand_events       members of the brand
-- Writes: a lead inserts and edits their own reviews (and their issues) on the
-- brands they lead. Nobody deletes a review. Every other table is read-only
-- through the API; the seed and future importer write as a privileged role.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- The helpers live in a schema PostgREST does not expose, so they cannot be
-- called as RPC endpoints. They are security definer so that a policy on one
-- table can read brand_memberships without triggering that table's own policy
-- (which itself calls is_lead_of: that would recurse). Each one only answers a
-- question about auth.uid(), never about an arbitrary user, so running with the
-- owner's rights leaks nothing.
create schema if not exists private;

grant usage on schema private to authenticated;
revoke all on schema private from anon, public;

create function private.is_member_of(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.brand_memberships m
    where m.user_id = (select auth.uid()) and m.brand_id = target_brand
  );
$$;

create function private.is_lead_of(target_brand uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.brand_memberships m
    where m.user_id = (select auth.uid()) and m.brand_id = target_brand and m.role = 'lead'
  );
$$;

-- True when the caller and target_user work on at least one common brand. Used
-- to read names only; what they can see of each other's work is decided by the
-- replies and reviews policies.
create function private.shares_brand_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.brand_memberships mine
    join public.brand_memberships theirs on theirs.brand_id = mine.brand_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = target_user
  );
$$;

-- Postgres grants execute to PUBLIC by default. Policies are evaluated as the
-- calling role, so authenticated needs execute; anon never does.
revoke execute on function private.is_member_of(uuid), private.is_lead_of(uuid),
  private.shares_brand_with(uuid) from public, anon;
grant execute on function private.is_member_of(uuid), private.is_lead_of(uuid),
  private.shares_brand_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Table privileges
-- ---------------------------------------------------------------------------

-- Supabase grants every privilege on public tables to anon and authenticated and
-- leaves the filtering to RLS. Narrow it: anon (no session) reads nothing, and
-- authenticated cannot truncate (RLS does not apply to truncate), reference or
-- add triggers. Tables with no write policy also lose insert/update/delete, so a
-- missing policy is not the only thing standing between a user and a write.
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke insert, update, delete on public.profiles, public.brands, public.brand_memberships,
  public.replies, public.issue_types, public.brand_events from authenticated;

-- Reviews: a lead may change the judgement, never what it is attached to.
-- Column grants make reply_id, brand_id and reviewer_id immutable through the API.
revoke update, delete on public.reviews from authenticated;
grant update (score, comment, is_exemplar) on public.reviews to authenticated;

-- review_issues rows are added and removed, never edited.
revoke update on public.review_issues from authenticated;

-- Tables and functions created by later migrations start from the same baseline.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, public;

-- ---------------------------------------------------------------------------
-- Read policies
-- ---------------------------------------------------------------------------

create policy brands_select on public.brands
  for select to authenticated
  using (private.is_member_of(id));

create policy brand_memberships_select on public.brand_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_lead_of(brand_id));

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_brand_with(id));

-- A specialist sees their own replies in every brand; a lead sees every reply of
-- the brands they lead. Nobody sees a reply only because they share a brand
-- with its author.
create policy replies_select on public.replies
  for select to authenticated
  using (specialist_id = (select auth.uid()) or private.is_lead_of(brand_id));

-- The subquery on replies runs under the replies policy, which is fine: the
-- author can see their own reply, so this adds no access.
create policy reviews_select on public.reviews
  for select to authenticated
  using (
    private.is_lead_of(brand_id)
    or exists (
      select 1 from public.replies r
      where r.id = reply_id and r.specialist_id = (select auth.uid())
    )
  );

-- Delegates to the reviews policy: an issue is visible exactly when its review is.
create policy review_issues_select on public.review_issues
  for select to authenticated
  using (exists (select 1 from public.reviews rv where rv.id = review_id));

-- The issue catalog is the same for every brand and holds no tenant data, so any
-- signed-in user may read it. It is the only unconditional policy in the schema.
create policy issue_types_select on public.issue_types
  for select to authenticated
  using (true);

create policy brand_events_select on public.brand_events
  for select to authenticated
  using (private.is_member_of(brand_id));

-- ---------------------------------------------------------------------------
-- Write policies
-- ---------------------------------------------------------------------------

-- brand_id cannot lie about the reply: the composite foreign key
-- (reply_id, brand_id) -> replies (id, brand_id) rejects a mismatch, so checking
-- is_lead_of(brand_id) here is checking the reply's real brand.
create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (reviewer_id = (select auth.uid()) and private.is_lead_of(brand_id));

-- Only your own review, and only while you still lead the brand. The column
-- grant above already keeps reply_id, brand_id and reviewer_id from changing.
create policy reviews_update on public.reviews
  for update to authenticated
  using (reviewer_id = (select auth.uid()) and private.is_lead_of(brand_id))
  with check (reviewer_id = (select auth.uid()) and private.is_lead_of(brand_id));

create policy review_issues_insert on public.review_issues
  for insert to authenticated
  with check (
    exists (
      select 1 from public.reviews rv
      where rv.id = review_id
        and rv.reviewer_id = (select auth.uid())
        and private.is_lead_of(rv.brand_id)
    )
  );

create policy review_issues_delete on public.review_issues
  for delete to authenticated
  using (
    exists (
      select 1 from public.reviews rv
      where rv.id = review_id
        and rv.reviewer_id = (select auth.uid())
        and private.is_lead_of(rv.brand_id)
    )
  );

-- updated_at is not in the column grant, so the app cannot set it; a trigger
-- keeps it true on every edit.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function private.touch_updated_at();
