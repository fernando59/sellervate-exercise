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
  raise notice 'ok: Nuria cannot review a Voltra reply (direct writes revoked)';
end $$;

reset role;

-- A review claims a Hebra brand_id for a Voltra reply: the composite FK rejects
-- it. Run as the owner, since no app role can insert reviews directly anymore
-- (save_review migration); this checks the schema, not the grants.
do $$
begin
  insert into public.reviews (reply_id, brand_id, reviewer_id, score)
  values (current_setting('sellervate.voltra_reply')::uuid, 'b0000000-0000-4000-8000-000000000003',
          'a0000000-0000-4000-8000-000000000002', 5);
  raise exception 'FAIL: review saved with a brand_id that is not the reply''s';
exception when foreign_key_violation then
  raise notice 'ok: a review cannot lie about its brand (composite FK)';
end $$;

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

-- Marta tags a review with a retired issue type directly. Since save_review,
-- the revoke stops this before the policy does; the function rejects retired
-- codes on its own (22023, below).
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

-- Dani sees Marta (their lead) but not Leo, a fellow specialist on Voltra.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000004') then
    raise exception 'FAIL: a specialist sees a fellow specialist';
  end if;
  if not exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') then
    raise exception 'FAIL: a specialist cannot see their lead';
  end if;
  raise notice 'ok: specialists see their leads, not each other';
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

-- save_review (TASK-004) ---------------------------------------------------------

-- Marta skips save_review and writes directly, as a POST to /rest/v1/reviews
-- would: a 5 with a critical issue. Direct writes are revoked.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  insert into public.reviews (reply_id, brand_id, reviewer_id, score)
  values (current_setting('sellervate.voltra_reply')::uuid, current_setting('sellervate.voltra_brand')::uuid,
          'a0000000-0000-4000-8000-000000000001', 5);
  raise exception 'FAIL: a lead inserted a review directly';
exception when insufficient_privilege then
  raise notice 'ok: reviews are written only through save_review';
end $$;
do $$
begin
  delete from public.review_issues
  where review_id in (select id from public.reviews where reviewer_id = 'a0000000-0000-4000-8000-000000000001');
  raise exception 'FAIL: a lead removed issues directly';
exception when insufficient_privilege then
  raise notice 'ok: review issues are written only through save_review';
end $$;
reset role;

-- The comment limit holds for any writer, not only the function.
do $$
begin
  update public.reviews set comment = repeat('x', 2001)
  where id = (select id from public.reviews limit 1);
  raise exception 'FAIL: a 2001-character comment was stored';
exception when check_violation then
  raise notice 'ok: comments are capped at 2000 characters (check constraint)';
end $$;

-- Nuria saves a review on a leaked Voltra reply id: she cannot see the reply.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  perform public.save_review(current_setting('sellervate.voltra_reply')::uuid, 1, '', '{}');
  raise exception 'FAIL: Nuria saved a review on a Voltra reply';
exception when sqlstate 'PT404' then
  raise notice 'ok: save_review hides another brand''s reply (PT404)';
end $$;
reset role;

-- Dani sees their own reply but is not a lead: explicit 42501.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  own_reply uuid;
begin
  select id into own_reply from public.replies where specialist_id = 'a0000000-0000-4000-8000-000000000003' limit 1;
  perform public.save_review(own_reply, 5, '', '{}');
  raise exception 'FAIL: a specialist reviewed their own reply';
exception when insufficient_privilege then
  raise notice 'ok: save_review rejects a specialist (42501)';
end $$;
reset role;

-- Marta: invalid input is rejected; saving twice edits one review.
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  reply uuid := current_setting('sellervate.voltra_reply')::uuid;
  first_id uuid;
  second_id uuid;
  issues text[];
begin
  begin
    perform public.save_review(reply, 4, '', '{wrong_info}');
    raise exception 'FAIL: a critical issue with score 4 was saved';
  exception when invalid_parameter_value then
    raise notice 'ok: a critical issue caps the score at 2 (22023)';
  end;
  begin
    perform public.save_review(reply, 6, '', '{}');
    raise exception 'FAIL: score 6 was saved';
  exception when invalid_parameter_value then
    raise notice 'ok: score outside 1-5 is rejected (22023)';
  end;
  begin
    perform public.save_review(reply, 3, '', '{made_up}');
    raise exception 'FAIL: an unknown issue code was saved';
  exception when invalid_parameter_value then
    raise notice 'ok: unknown issue codes are rejected (22023)';
  end;
  begin
    -- slow was retired earlier in this transaction.
    perform public.save_review(reply, 3, '', '{slow}');
    raise exception 'FAIL: a retired issue code was saved';
  exception when invalid_parameter_value then
    raise notice 'ok: retired issue codes are rejected (22023)';
  end;

  first_id := public.save_review(reply, 2, '  Diagnose first.  ', '{skipped_procedure,tone}');
  second_id := public.save_review(reply, 1, 'Diagnose first.', '{skipped_procedure,length}');
  select array_agg(issue_code order by issue_code) into issues from public.review_issues where review_id = second_id;
  if first_id <> second_id
     or (select count(*) from public.reviews where reply_id = reply and reviewer_id = auth.uid()) <> 1
     or issues <> '{length,skipped_procedure}'
     or (select score from public.reviews where id = second_id) <> 1 then
    raise exception 'FAIL: saving again did not edit the same review (issues %)', issues;
  end if;
  raise notice 'ok: saving again edits the review and replaces its issues';
end $$;
reset role;

-- Marta stops leading Voltra: save_review checks the membership at call time.
delete from public.brand_memberships
where user_id = 'a0000000-0000-4000-8000-000000000001' and brand_id = current_setting('sellervate.voltra_brand')::uuid;
set local role authenticated;
do $$
begin
  perform public.save_review(current_setting('sellervate.voltra_reply')::uuid, 3, '', '{}');
  raise exception 'FAIL: a former lead saved a review';
exception when sqlstate 'PT404' then
  raise notice 'ok: a lead who left the brand can no longer review it (PT404)';
end $$;
reset role;

rollback;
