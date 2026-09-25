-- How many rows of each table every seed person sees through RLS, plus the
-- writes that must be rejected. Run by hand against the local database:
--
--   docker exec -i supabase_db_sellervate-qa psql -U postgres -d postgres < supabase/tests/rls-matrix.sql
--
-- Each block impersonates one person exactly as PostgREST does: role
-- authenticated and the user id in request.jwt.claims. Everything runs in a
-- transaction that is rolled back, so it leaves the database untouched.
--
-- Not a pgTAP suite (see DECISIONS.md); the expected numbers are written next
-- to the output in the TASK-003 pull request.

begin;

create temporary table rls_matrix (person text, brands int, memberships int, profiles int,
  replies int, reviews int, review_issues int, issue_types int, brand_events int,
  hebra_replies int, foreign_replies int);
grant all on rls_matrix to authenticated;

create function pg_temp.check_person(person text, uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into rls_matrix select
    person,
    (select count(*) from public.brands),
    (select count(*) from public.brand_memberships),
    (select count(*) from public.profiles),
    (select count(*) from public.replies),
    (select count(*) from public.reviews),
    (select count(*) from public.review_issues),
    (select count(*) from public.issue_types),
    (select count(*) from public.brand_events),
    (select count(*) from public.replies r join public.brands b on b.id = r.brand_id where b.slug = 'hebra'),
    -- Replies visible to this person that they neither wrote nor lead: must be 0.
    (select count(*) from public.replies r
      where r.specialist_id <> uid
        and not exists (select 1 from public.brand_memberships m
                        where m.user_id = uid and m.brand_id = r.brand_id and m.role = 'lead'));
  reset role;
end;
$$;

select pg_temp.check_person('marta', 'a0000000-0000-4000-8000-000000000001');
select pg_temp.check_person('nuria', 'a0000000-0000-4000-8000-000000000002');
select pg_temp.check_person('dani',  'a0000000-0000-4000-8000-000000000003');
select pg_temp.check_person('leo',   'a0000000-0000-4000-8000-000000000004');
select pg_temp.check_person('sara',  'a0000000-0000-4000-8000-000000000005');

-- anon (no session) has no table privileges at all.
set local role anon;
do $$
begin
  perform count(*) from public.replies;
  raise exception 'FAIL: anon read replies';
exception when insufficient_privilege then
  raise notice 'ok: anon cannot read replies';
end $$;
reset role;

select * from rls_matrix;

-- Writes that must fail -------------------------------------------------------

-- Nuria (lead of Hebra only) reviews a Voltra reply. RLS already hides Voltra
-- replies from her, so take the ids as the superuser, as if they had leaked.
do $$
declare
  voltra_reply uuid;
  voltra_brand uuid;
begin
  select r.id, r.brand_id into voltra_reply, voltra_brand
  from public.replies r join public.brands b on b.id = r.brand_id
  where b.slug = 'voltra' limit 1;
  perform set_config('sellervate.voltra_reply', voltra_reply::text, true);
  perform set_config('sellervate.voltra_brand', voltra_brand::text, true);
end $$;

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  insert into public.reviews (reply_id, brand_id, reviewer_id, score)
  values (current_setting('sellervate.voltra_reply')::uuid, current_setting('sellervate.voltra_brand')::uuid,
          'a0000000-0000-4000-8000-000000000002', 5);
  raise exception 'FAIL: Nuria reviewed a Voltra reply';
exception when insufficient_privilege then
  raise notice 'ok: Nuria cannot review a Voltra reply (RLS with check)';
end $$;

-- Nuria claims a Hebra brand_id for the Voltra reply: the composite FK rejects it.
do $$
begin
  insert into public.reviews (reply_id, brand_id, reviewer_id, score)
  values (current_setting('sellervate.voltra_reply')::uuid, 'b0000000-0000-4000-8000-000000000003',
          'a0000000-0000-4000-8000-000000000002', 5);
  raise exception 'FAIL: review saved with a brand_id that is not the reply''s';
exception when foreign_key_violation then
  raise notice 'ok: a review cannot lie about its brand (composite FK)';
end $$;
reset role;

-- Marta tries to move one of her reviews to another reviewer, and to delete it.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  update public.reviews set reviewer_id = 'a0000000-0000-4000-8000-000000000002'
  where reviewer_id = 'a0000000-0000-4000-8000-000000000001';
  raise exception 'FAIL: reviewer_id changed';
exception when insufficient_privilege then
  raise notice 'ok: reviewer_id is not updatable';
end $$;
do $$
begin
  delete from public.reviews;
  raise exception 'FAIL: review deleted';
exception when insufficient_privilege then
  raise notice 'ok: reviews cannot be deleted';
end $$;
do $$
begin
  truncate public.review_issues;
  raise exception 'FAIL: truncate allowed';
exception when insufficient_privilege then
  raise notice 'ok: truncate is revoked';
end $$;
reset role;

-- Dani (specialist) tries to review one of their own replies.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  insert into public.reviews (reply_id, brand_id, reviewer_id, score)
  select id, brand_id, 'a0000000-0000-4000-8000-000000000003', 5
  from public.replies where specialist_id = 'a0000000-0000-4000-8000-000000000003' limit 1;
  raise exception 'FAIL: a specialist wrote a review';
exception when insufficient_privilege then
  raise notice 'ok: a specialist cannot write reviews';
end $$;
reset role;

-- Marta backdates a review: created_at is not in the insert grant.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  insert into public.reviews (reply_id, brand_id, reviewer_id, score, created_at)
  values (current_setting('sellervate.voltra_reply')::uuid, current_setting('sellervate.voltra_brand')::uuid,
          'a0000000-0000-4000-8000-000000000001', 4, '2020-01-01');
  raise exception 'FAIL: created_at set by the client';
exception when insufficient_privilege then
  raise notice 'ok: a review cannot be backdated';
end $$;
reset role;

-- Marta tags a review with a retired issue type.
update public.issue_types set active = false where code = 'slow';
set local role authenticated;
do $$
begin
  insert into public.review_issues (review_id, issue_code)
  select id, 'slow' from public.reviews
  where reviewer_id = 'a0000000-0000-4000-8000-000000000001'
    and id not in (select review_id from public.review_issues where issue_code = 'slow')
  limit 1;
  raise exception 'FAIL: retired issue type added';
exception when insufficient_privilege then
  raise notice 'ok: retired issue types cannot be added';
end $$;
reset role;

-- Leo leaves Hebra: Nuria still sees who wrote his old Hebra replies.
delete from public.brand_memberships
where user_id = 'a0000000-0000-4000-8000-000000000004' and brand_id = 'b0000000-0000-4000-8000-000000000003';
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  missing int;
begin
  select count(*) into missing from public.replies r
  where not exists (select 1 from public.profiles p where p.id = r.specialist_id);
  if missing > 0 then raise exception 'FAIL: % replies without a visible author', missing; end if;
  raise notice 'ok: a lead still sees the author after they leave the brand';
end $$;
reset role;

-- The global "revoke execute on functions from public" in the authorization
-- migration only affects functions created after it. The extensions the app
-- relies on (pgcrypto, uuid-ossp) were installed before, so none of their
-- functions, nor any of ours, may have lost execute for authenticated.
do $$
declare
  lost text;
begin
  select string_agg(n.nspname || '.' || p.proname, ', ') into lost
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('extensions', 'public')
    and pg_get_userbyid(p.proowner) = 'postgres'
    and not has_function_privilege('authenticated', p.oid, 'execute');
  if lost is not null then raise exception 'FAIL: authenticated lost execute on %', lost; end if;
  raise notice 'ok: the global revoke did not strip execute from existing functions';
end $$;

-- A security definer function created later in public is not callable by anon.
create function public.zz_rls_matrix_probe() returns int language sql security definer as $$ select 1 $$;
do $$
begin
  if has_function_privilege('anon', 'public.zz_rls_matrix_probe()', 'execute') then
    raise exception 'FAIL: anon can execute a new function in public';
  end if;
  raise notice 'ok: new functions are not executable by anon';
end $$;

rollback;
