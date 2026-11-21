-- Row Level Security tests: sign in as each role and check what it can read and write.
-- Run after supabase_stub.sql + the migration + seed.sql (see supabase/tests/run.sh).
-- Everything happens in one transaction and is rolled back.
\set ON_ERROR_STOP on
begin;

-- helpers (owned by the test runner, callable by the API roles)
create schema tst;
grant usage on schema tst to anon, authenticated;
-- run a statement; return its SQLSTATE, or 'ok'
create function tst.err(q text) returns text language plpgsql as $$
begin execute q; return 'ok'; exception when others then return sqlstate; end $$;
-- run a statement; return how many rows it changed
create function tst.n(q text) returns int language plpgsql as $$
declare c int; begin execute q; get diagnostics c = row_count; return c; end $$;
grant execute on all functions in schema tst to anon, authenticated;

-- ids from seed.sql
\set kim     '11111111-1111-4111-8111-111111111111'
\set park    '22222222-2222-4222-8222-222222222222'
\set taylor  '33333333-3333-4333-8333-333333333333'
\set allen   '44444444-4444-4444-8444-444444444444'
\set office  '55555555-5555-4555-8555-555555555555'

-- ======================================================== parent (Kim: Grace Gr.10 intl, Joshua Gr.4)
select set_config('request.jwt.claims', json_build_object('sub', :'kim')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert (select count(*) from public.students) = 2, 'kim sees only her 2 children';
  assert not exists (select 1 from public.students where first_name = 'Daniel'), 'kim cannot see another family''s child';
  assert (select count(*) from public.guardians) = 2, 'kim sees her own guardian links';
  assert (select count(*) from public.classes) = 2, 'kim sees her children''s classes';
  -- all + upper (Grace) + intl (Grace) + Grade 4 class notice (Joshua)
  assert (select count(*) from public.announcements) = 4, 'kim sees all/upper/intl/class notices for her children';
  assert (select count(*) from public.grades) = 2, 'kim sees only Grace''s grades';
  assert (select count(*) from public.attendance) = 2, 'kim sees her children''s attendance';
  assert (select count(*) from public.doc_requests) = 1, 'kim sees her request';
  assert (select count(*) from public.profiles) = 4, 'kim sees herself + staff, not other parents';
  assert not exists (select 1 from public.profiles where full_name = 'The Park Family'), 'kim cannot see the Park family';
  assert (select count(*) from public.threads) = 1 and (select count(*) from public.messages) = 1, 'kim sees her thread';
  assert (select count(*) from storage.objects) = 1, 'kim can read only her child''s document file';

  assert tst.err($q$insert into public.doc_requests (student_id, requested_by, type) values ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'transcript')$q$) = 'ok', 'kim can request a document for Grace';
  assert tst.err($q$insert into public.doc_requests (student_id, requested_by, type) values ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'transcript')$q$) = '42501', 'kim cannot request for another child';
  assert tst.err($q$insert into public.doc_requests (student_id, requested_by, type, status, file_path) values ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'transcript', 'ready', 'x.pdf')$q$) = '42501', 'kim cannot create an already-issued request';
  assert tst.n($q$update public.doc_requests set status = 'in_review'$q$) = 0, 'kim cannot move a request forward';
  assert tst.err($q$insert into public.grades (student_id, class_id, term, label, score) values ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Self-graded', 100)$q$) = '42501', 'kim cannot write grades';
  assert tst.n($q$update public.profiles set lang = 'en' where id = '11111111-1111-4111-8111-111111111111'$q$) = 1, 'kim can change her language';
  assert tst.err($q$update public.profiles set role = 'admin' where id = '11111111-1111-4111-8111-111111111111'$q$) = '42501', 'kim cannot make herself admin';
  assert tst.err($q$insert into public.messages (thread_id, sender_id, body) values ('d0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Yes, please!')$q$) = 'ok', 'kim can reply in her thread';
  assert tst.err($q$insert into public.messages (thread_id, sender_id, body) values ('d0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'spoofed')$q$) = '42501', 'kim cannot send as the teacher';
  assert tst.n($q$update public.messages set read_at = now() where sender_id = '33333333-3333-4333-8333-333333333333'$q$) = 1, 'kim can mark the teacher''s message read';
  assert tst.n($q$update public.messages set read_at = now() where sender_id = '11111111-1111-4111-8111-111111111111'$q$) = 0, 'kim cannot mark her own message read';
  assert tst.err($q$insert into public.announcement_reads (announcement_id, user_id) values ('b0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111')$q$) = 'ok', 'kim can mark a visible notice read';
  assert tst.err($q$insert into public.announcements (author_id, title, body, audience, category) values ('11111111-1111-4111-8111-111111111111', 'x', 'y', 'all', 'event')$q$) = '42501', 'parents cannot post notices';
end $$;
reset role;

-- ======================================================== parent (Park: Daniel Gr.10, not international)
select set_config('request.jwt.claims', json_build_object('sub', :'park')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert (select count(*) from public.students) = 1, 'park sees only Daniel';
  assert (select count(*) from public.announcements) = 2, 'park sees all + upper only (no intl, no Grade 4 class notice)';
  assert (select count(*) from public.threads) = 0 and (select count(*) from public.messages) = 0, 'park cannot see the Kims'' thread';
  assert (select count(*) from public.doc_requests) = 0, 'park cannot see the Kims'' request';
  assert (select count(*) from storage.objects) = 1, 'park reads only Daniel''s file';
  assert tst.err($q$insert into public.threads (student_id, parent_id, teacher_id) values ('a0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')$q$) = '42501', 'park cannot open a thread about Grace';
  assert tst.err($q$insert into public.threads (student_id, parent_id, teacher_id) values ('a0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333')$q$) = 'ok', 'park can open a thread with a teacher about Daniel';
end $$;
reset role;

-- ======================================================== teacher (Taylor: English II with Grace + Daniel)
select set_config('request.jwt.claims', json_build_object('sub', :'taylor')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert (select count(*) from public.students) = 2, 'taylor sees her 2 students';
  assert not exists (select 1 from public.students where first_name = 'Joshua'), 'taylor cannot see a student outside her classes';
  assert (select count(*) from public.grades) = 3, 'taylor sees her class''s grades';
  assert (select count(*) from public.announcements) = 4, 'staff see every notice';
  assert (select count(*) from public.profiles) = 5, 'taylor sees staff + parents of her students';
  -- the Kims' thread + the one Park opened above: only threads where she is the teacher
  assert (select count(*) from public.threads) = 2 and not exists (select 1 from public.threads where teacher_id <> '33333333-3333-4333-8333-333333333333'), 'taylor sees only her own threads';
  assert (select count(*) from public.doc_requests) = 0, 'document requests are for the office';
  assert (select count(*) from storage.objects) = 0, 'teachers cannot read issued documents';

  assert tst.err($q$insert into public.grades (student_id, class_id, term, label, score, letter) values ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Unit 3 Test', 88, 'B+')$q$) = 'ok', 'taylor can grade her student';
  assert tst.err($q$insert into public.grades (student_id, class_id, term, label, score) values ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Unit 3 Test', 88)$q$) = '42501', 'taylor cannot grade a student not in her class';
  assert tst.err($q$insert into public.grades (student_id, class_id, term, label, score) values ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'Fall 2026', 'Spelling', 90)$q$) = '42501', 'taylor cannot write in another teacher''s class';
  assert tst.err($q$insert into public.grades (student_id, class_id, term, label, score) values ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Quiz', 140)$q$) = '23514', 'scores must be 0-100';
  assert tst.n($q$update public.grades set score = 70 where label = 'Unit 3 Test' and student_id = 'a0000000-0000-4000-8000-000000000001'$q$) = 1, 'taylor can change a grade';
  assert tst.err($q$insert into public.attendance (student_id, date, status, recorded_by) values ('a0000000-0000-4000-8000-000000000003', '2026-11-21', 'absent', '33333333-3333-4333-8333-333333333333')$q$) = 'ok', 'taylor can take attendance';
  assert tst.err($q$insert into public.attendance (student_id, date, status, recorded_by) values ('a0000000-0000-4000-8000-000000000002', '2026-11-21', 'absent', '33333333-3333-4333-8333-333333333333')$q$) = '42501', 'taylor cannot take attendance for another class';
  assert tst.err($q$insert into public.announcements (author_id, title, body, audience, class_id, category) values ('33333333-3333-4333-8333-333333333333', 'x', 'y', 'class', 'c0000000-0000-4000-8000-000000000002', 'event')$q$) = '42501', 'taylor cannot post to another teacher''s class';
  assert tst.err($q$insert into public.announcements (author_id, title, body, audience, class_id, category) values ('33333333-3333-4333-8333-333333333333', 'Essay due', 'Friday', 'class', 'c0000000-0000-4000-8000-000000000001', 'academics')$q$) = 'ok', 'taylor can post to her class';
  assert tst.err($q$insert into public.announcements (author_id, title, body, audience, category) values ('55555555-5555-4555-8555-555555555555', 'x', 'y', 'all', 'event')$q$) = '42501', 'taylor cannot post as someone else';
  assert tst.n($q$update public.doc_requests set status = 'in_review'$q$) = 0, 'taylor cannot process requests';
end $$;
reset role;

-- ======================================================== teacher (Allen: Grade 4 with Joshua)
select set_config('request.jwt.claims', json_build_object('sub', :'allen')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert (select count(*) from public.students) = 1, 'allen sees Joshua only';
  assert (select count(*) from public.threads) = 0, 'allen sees no other teacher''s threads';
  assert (select count(*) from public.grades) = 0, 'allen sees no English II grades';
end $$;
reset role;

-- ======================================================== admin (Front Office)
select set_config('request.jwt.claims', json_build_object('sub', :'office')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert (select count(*) from public.students) = 3, 'office sees every student';
  assert (select count(*) from public.doc_requests) >= 1, 'office sees requests';
  assert (select count(*) from storage.objects) = 2, 'office reads every document';
  assert tst.n($q$update public.doc_requests set status = 'in_review' where id = 'e0000000-0000-4000-8000-000000000001'$q$) = 1, 'office starts the review';
  assert tst.err($q$update public.doc_requests set status = 'ready' where id = 'e0000000-0000-4000-8000-000000000001'$q$) = 'P0001', 'a digital document needs its file before Ready';
  assert tst.err($q$update public.doc_requests set status = 'rejected' where id = 'e0000000-0000-4000-8000-000000000001'$q$) = '23514', 'a rejection needs a reason';
  assert tst.err($q$update public.doc_requests set status = 'ready', file_path = 'a0000000-0000-4000-8000-000000000001/e0000000-0000-4000-8000-000000000001.pdf' where id = 'e0000000-0000-4000-8000-000000000001'$q$) = 'ok', 'office issues the document';
  assert tst.err($q$update public.doc_requests set status = 'submitted' where id = 'e0000000-0000-4000-8000-000000000001'$q$) = 'P0001', 'status cannot go backwards';
  assert tst.err($q$insert into storage.objects (bucket_id, name) values ('documents', 'a0000000-0000-4000-8000-000000000002/new.pdf')$q$) = 'ok', 'office uploads documents';
  assert tst.err($q$update public.profiles set role = 'teacher' where id = '22222222-2222-4222-8222-222222222222'$q$) = '42501', 'role changes go through the service role (Edge Function), not the browser';
  assert tst.err($q$insert into public.students (first_name, last_name, grade, division) values ('New', 'Student', 1, 'lower')$q$) = 'ok', 'office enrols students';
end $$;
reset role;

-- a parent may not upload into the private bucket
select set_config('request.jwt.claims', json_build_object('sub', :'kim')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert tst.err($q$insert into storage.objects (bucket_id, name) values ('documents', 'a0000000-0000-4000-8000-000000000001/forged.pdf')$q$) = '42501', 'parents cannot upload documents';
end $$;
reset role;

-- ======================================================== anonymous (not signed in)
select set_config('request.jwt.claims', '', true) as _ \gset
set local role anon;
do $$ begin
  assert tst.err('select * from public.students') = '42501', 'anonymous cannot read students';
  assert tst.err('select * from public.announcements') = '42501', 'anonymous cannot read notices';
end $$;
reset role;

-- ======================================================== invitations create profiles
do $$ begin
  insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data)
  values ('66666666-6666-4666-8666-666666666666', 'new.teacher@example.com', '{"role":"teacher"}', '{"full_name":"New Teacher","lang":"es"}');
  assert (select role || '/' || lang from public.profiles where id = '66666666-6666-4666-8666-666666666666') = 'teacher/es', 'an invited user gets a profile with the invited role';
  -- a self-made role in user_metadata is ignored; without app_metadata there is no profile
  insert into auth.users (id, email, raw_user_meta_data)
  values ('77777777-7777-4777-8777-777777777777', 'signup@example.com', '{"role":"admin","full_name":"Sneaky"}');
  assert not exists (select 1 from public.profiles where id = '77777777-7777-4777-8777-777777777777'), 'a user without an invited role gets no profile';
end $$;
select set_config('request.jwt.claims', json_build_object('sub', '77777777-7777-4777-8777-777777777777')::text, true) as _ \gset
set local role authenticated;
do $$ begin
  assert (select count(*) from public.students) = 0, 'uninvited: no students';
  assert (select count(*) from public.announcements) = 0, 'uninvited: no notices, not even school-wide ones';
  assert (select count(*) from public.events) = 0, 'uninvited: no calendar';
  assert (select count(*) from public.profiles) = 0, 'uninvited: no staff names or emails';
  assert tst.err($q$insert into public.doc_requests (student_id, requested_by, type) values ('a0000000-0000-4000-8000-000000000001', '77777777-7777-4777-8777-777777777777', 'transcript')$q$) = '42501', 'uninvited: cannot request documents';
end $$;
reset role;

-- every public table has RLS on
do $$ begin
  assert not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity), 'every public table has RLS enabled';
end $$;

\echo 'RLS tests passed'
rollback;
