-- Demo seed for LOCAL development (`supabase db reset`). Every person here is fictional.
-- Never load this into the production project, and never put real children's data in it.
-- All demo accounts use the password: cornerstone-demo
--
-- Roles go in raw_app_meta_data (only the service role can set it); the
-- on_auth_user_created trigger turns each user into a profile.

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kim.family@example.com', extensions.crypt('cornerstone-demo', extensions.gen_salt('bf')), now(), '{"role":"parent"}',  '{"full_name":"The Kim Family","lang":"ko"}'),
('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'park.family@example.com', extensions.crypt('cornerstone-demo', extensions.gen_salt('bf')), now(), '{"role":"parent"}',  '{"full_name":"The Park Family","lang":"en"}'),
('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's.taylor@example.com',    extensions.crypt('cornerstone-demo', extensions.gen_salt('bf')), now(), '{"role":"teacher"}', '{"full_name":"Mrs. Sarah Taylor"}'),
('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'allen@example.com',       extensions.crypt('cornerstone-demo', extensions.gen_salt('bf')), now(), '{"role":"teacher"}', '{"full_name":"Mrs. Allen"}'),
('55555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'office@example.com',      extensions.crypt('cornerstone-demo', extensions.gen_salt('bf')), now(), '{"role":"admin"}',   '{"full_name":"Front Office"}');

insert into public.students (id, first_name, last_name, grade, division, student_code, dob, entered_on, is_international) values
('a0000000-0000-4000-8000-000000000001', 'Grace',  'Kim',  10, 'upper', 'DEMO-0142', '2011-03-14', '2024-08-15', true),
('a0000000-0000-4000-8000-000000000002', 'Joshua', 'Kim',   4, 'lower', 'DEMO-0217', '2017-09-02', '2023-08-15', false),
('a0000000-0000-4000-8000-000000000003', 'Daniel', 'Park', 10, 'upper', 'DEMO-0158', '2011-06-21', '2025-08-15', false);

insert into public.guardians (parent_id, student_id) values
('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001'),
('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002'),
('22222222-2222-4222-8222-222222222222', 'a0000000-0000-4000-8000-000000000003');

insert into public.classes (id, name, division, period, teacher_id) values
('c0000000-0000-4000-8000-000000000001', 'English II (Honors)', 'upper', 2, '33333333-3333-4333-8333-333333333333'),
('c0000000-0000-4000-8000-000000000002', 'Grade 4',             'lower', null, '44444444-4444-4444-8444-444444444444');

insert into public.enrollments (student_id, class_id) values
('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001'),
('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001'),
('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002');

insert into public.announcements (id, author_id, title, body, translations, audience, class_id, category) values
('b0000000-0000-4000-8000-000000000001', '55555555-5555-4555-8555-555555555555', 'Thanksgiving Break — No School Nov 24–28', 'Campus will be closed for Thanksgiving Break.',
  '{"ko":{"title":"추수감사절 방학 — 11월 24–28일 휴교","body":"추수감사절 방학 기간에는 캠퍼스가 문을 닫습니다."}}', 'all', null, 'urgent'),
('b0000000-0000-4000-8000-000000000002', '55555555-5555-4555-8555-555555555555', 'Upper School Semester Exam Schedule', 'Semester exams run December 15–18.', '{}', 'upper', null, 'academics'),
('b0000000-0000-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444', 'Grade 4 reading log due Friday', 'Please sign this week''s reading log.', '{}', 'class', 'c0000000-0000-4000-8000-000000000002', 'academics'),
('b0000000-0000-4000-8000-000000000004', '55555555-5555-4555-8555-555555555555', 'I-20 renewal reminders', 'International families: please check your I-20 dates.', '{}', 'intl', null, 'community');

insert into public.threads (id, student_id, parent_id, teacher_id) values
('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333');
insert into public.messages (thread_id, sender_id, body) values
('d0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Grace''s essay on Hebrews 11 was outstanding.');

insert into public.grades (student_id, class_id, term, label, score, letter) values
('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Essay: Hebrews 11', 98, 'A'),
('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Unit 3 Test',       95, 'A'),
('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'Fall 2026', 'Essay: Hebrews 11', 91, 'A-');

insert into public.attendance (student_id, date, status, recorded_by) values
('a0000000-0000-4000-8000-000000000001', '2026-11-20', 'present', '33333333-3333-4333-8333-333333333333'),
('a0000000-0000-4000-8000-000000000002', '2026-11-20', 'tardy',   '44444444-4444-4444-8444-444444444444');

insert into public.doc_requests (id, student_id, requested_by, type, purpose, copies, language, delivery) values
('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'enrollment', 'Visa / consulate', 1, 'en', 'digital');

insert into public.events (title, translations, starts_at, all_day, location) values
('Christmas Program', '{"ko":{"title":"성탄 프로그램"}}', '2026-12-04 18:30-06', false, 'Sanctuary'),
('Spring break', '{}', '2027-03-16 00:00-05', true, null);

insert into storage.objects (bucket_id, name) values
('documents', 'a0000000-0000-4000-8000-000000000001/e0000000-0000-4000-8000-000000000001.pdf'),
('documents', 'a0000000-0000-4000-8000-000000000003/demo-park.pdf');
