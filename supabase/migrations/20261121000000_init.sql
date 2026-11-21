-- Cornerstone Family Portal — initial schema, Row Level Security and storage.
-- Source of truth for the database (CLAUDE.md §6). Apply with `supabase db push`
-- or paste into the SQL editor of a new project.
--
-- Principles
--   * Every table has RLS enabled. Nothing is readable without a policy.
--   * parent  -> only rows tied to students linked to them in `guardians`
--   * teacher -> only their classes, their students and their own threads
--   * admin   -> everything (office staff)
--   * Roles come from auth `app_metadata.role` (set only by the service role when the
--     office invites someone). Public sign-up must be disabled in Auth settings.

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null check (role in ('parent', 'teacher', 'admin')),
  full_name   text not null,
  email       text not null,
  lang        text not null default 'en' check (lang in ('en', 'ko', 'zh', 'es')),
  created_at  timestamptz not null default now()
);

create table public.students (
  id               uuid primary key default gen_random_uuid(),
  first_name       text not null,
  last_name        text not null,
  grade            smallint not null check (grade between -1 and 12),   -- -1 = Pre-K, 0 = K
  division         text not null check (division in ('lower', 'middle', 'upper')),
  student_code     text unique,
  dob              date,
  entered_on       date,
  is_international boolean not null default false
);

create table public.guardians (
  parent_id  uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  primary key (parent_id, student_id)
);

create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  division   text not null check (division in ('lower', 'middle', 'upper')),
  period     smallint,
  teacher_id uuid references public.profiles (id) on delete set null
);

create table public.enrollments (
  student_id uuid not null references public.students (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  primary key (student_id, class_id)
);

create table public.announcements (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles (id),
  title        text not null,
  body         text not null,
  translations jsonb not null default '{}'::jsonb,  -- {"ko":{"title","body"},"zh":{...},"es":{...}}
  audience     text not null check (audience in ('all', 'lower', 'middle', 'upper', 'intl', 'class')),
  class_id     uuid references public.classes (id) on delete cascade,
  category     text not null check (category in ('academics', 'event', 'urgent', 'community')),
  created_at   timestamptz not null default now(),
  check ((audience = 'class') = (class_id is not null))
);

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- one thread per (student, parent, staff member); staff = a teacher or the office
create table public.threads (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  parent_id  uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, parent_id, teacher_id)
);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id),
  body       text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index on public.messages (thread_id, created_at);

create table public.grades (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  term       text not null,
  label      text not null,                       -- assignment name, e.g. 'Unit 3 Test'
  score      numeric(5, 2) check (score between 0 and 100),
  letter     text,
  updated_at timestamptz not null default now(),
  unique (student_id, class_id, term, label)
);

create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  date        date not null,
  status      text not null check (status in ('present', 'absent', 'tardy', 'excused')),
  recorded_by uuid references public.profiles (id),
  unique (student_id, date)
);

create table public.doc_requests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  requested_by  uuid not null references public.profiles (id),
  type          text not null check (type in ('enrollment', 'attendance', 'transcript', 'reportCard', 'goodStanding', 'immunization', 'i20')),
  purpose       text,
  copies        smallint not null default 1 check (copies between 1 and 5),
  language      text not null default 'en' check (language in ('en', 'en_ko', 'en_zh', 'en_es')),
  delivery      text not null default 'digital' check (delivery in ('digital', 'pickup', 'mail')),
  note          text,
  status        text not null default 'submitted' check (status in ('submitted', 'in_review', 'ready', 'rejected')),
  reject_reason text,
  file_path     text,                              -- storage: documents/<student_id>/<request_id>.pdf
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (status <> 'rejected' or nullif(trim(reject_reason), '') is not null)
);

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  translations jsonb not null default '{}'::jsonb,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  all_day      boolean not null default false,
  location     text,
  audience     text not null default 'all' check (audience in ('all', 'lower', 'middle', 'upper', 'intl'))
);

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER so policies can look things up without recursive RLS checks.
create function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('teacher', 'admin'), false)
$$;

create function public.is_guardian_of(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.guardians where parent_id = auth.uid() and student_id = sid)
$$;

create function public.teaches_class(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = cid and teacher_id = auth.uid())
$$;

create function public.teaches_student(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments e join public.classes c on c.id = e.class_id
                 where e.student_id = sid and c.teacher_id = auth.uid())
$$;

-- what a parent may see: school-wide, their children's divisions, International if a child
-- is international, and class notices for their children's classes. Staff see everything.
create function public.can_see_announcement(aud text, cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.my_role() is not null and (
         public.is_staff()
      or aud = 'all'
      or exists (
        select 1 from public.guardians g join public.students s on s.id = g.student_id
        where g.parent_id = auth.uid()
          and ( s.division = aud
             or (aud = 'intl' and s.is_international)
             or (aud = 'class' and exists (select 1 from public.enrollments e where e.student_id = s.id and e.class_id = cid)) )
      ))
$$;

create function public.is_thread_member(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.threads where id = tid and auth.uid() in (parent_id, teacher_id))
$$;

-- ---------------------------------------------------------------- triggers
-- New auth user (created by an office invitation) -> profile. The role must come from
-- app_metadata, which only the service role can set; without one, no profile is created
-- and the user can see nothing.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_app_meta_data ->> 'role' in ('parent', 'teacher', 'admin') then
    insert into public.profiles (id, role, full_name, email, lang)
    values (new.id,
            new.raw_app_meta_data ->> 'role',
            coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
            new.email,
            coalesce(nullif(new.raw_user_meta_data ->> 'lang', ''), 'en'));
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger grades_touch before update on public.grades for each row execute function public.touch_updated_at();
create trigger doc_requests_touch before update on public.doc_requests for each row execute function public.touch_updated_at();

-- document requests move forward only: submitted -> in_review -> ready, or -> rejected
create function public.doc_request_flow() returns trigger language plpgsql as $$
begin
  if new.status <> old.status and not (
       (old.status = 'submitted' and new.status in ('in_review', 'rejected'))
    or (old.status = 'in_review' and new.status in ('ready', 'rejected'))) then
    raise exception 'doc_requests: cannot move from % to %', old.status, new.status;
  end if;
  if new.status = 'ready' and new.file_path is null and new.delivery = 'digital' then
    raise exception 'doc_requests: a digital document needs file_path before it is ready';
  end if;
  return new;
end $$;
create trigger doc_requests_flow before update on public.doc_requests for each row execute function public.doc_request_flow();

-- ---------------------------------------------------------------- privileges
-- RLS decides rows; grants decide which commands/columns exist at all. Anonymous gets nothing.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.students, public.guardians, public.classes, public.enrollments,
  public.announcements, public.grades, public.attendance, public.events to authenticated;
grant insert on public.announcement_reads, public.threads, public.messages, public.doc_requests to authenticated;
grant update (full_name, lang) on public.profiles to authenticated;      -- not role or email
grant update (read_at) on public.messages to authenticated;              -- recipients mark read
grant update (status, reject_reason, file_path) on public.doc_requests to authenticated;  -- policy: admin only
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.profiles           enable row level security;
alter table public.students           enable row level security;
alter table public.guardians          enable row level security;
alter table public.classes            enable row level security;
alter table public.enrollments        enable row level security;
alter table public.announcements      enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.threads            enable row level security;
alter table public.messages           enable row level security;
alter table public.grades             enable row level security;
alter table public.attendance         enable row level security;
alter table public.doc_requests       enable row level security;
alter table public.events             enable row level security;

-- Note: a signed-in user WITHOUT a profile (i.e. not invited by the office) must see nothing;
-- policies that would otherwise be open to "everyone" check my_role() is not null.
-- profiles: yourself; staff profiles are visible to every member (names in threads);
-- staff also see the parents of their students; admin sees all.
create policy profiles_read on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin() or (public.my_role() is not null and role in ('teacher', 'admin'))
  or (public.is_staff() and exists (select 1 from public.guardians g where g.parent_id = profiles.id and public.teaches_student(g.student_id)))
);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- students and their links
create policy students_read on public.students for select to authenticated
  using (public.is_admin() or public.is_guardian_of(id) or public.teaches_student(id));
create policy students_admin on public.students for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy guardians_read on public.guardians for select to authenticated
  using (parent_id = auth.uid() or public.is_admin() or public.teaches_student(student_id));
create policy guardians_admin on public.guardians for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy classes_read on public.classes for select to authenticated using (
  public.is_staff()
  or exists (select 1 from public.enrollments e where e.class_id = classes.id and public.is_guardian_of(e.student_id))
);
create policy classes_admin on public.classes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy enrollments_read on public.enrollments for select to authenticated
  using (public.is_admin() or public.teaches_class(class_id) or public.is_guardian_of(student_id));
create policy enrollments_admin on public.enrollments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- announcements: staff post as themselves (teachers: school-wide audiences or their own class)
create policy ann_read on public.announcements for select to authenticated
  using (public.can_see_announcement(audience, class_id));
create policy ann_insert on public.announcements for insert to authenticated with check (
  author_id = auth.uid() and public.is_staff()
  and (audience <> 'class' or public.is_admin() or public.teaches_class(class_id))
);
create policy ann_update on public.announcements for update to authenticated
  using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy ann_delete on public.announcements for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create policy reads_own on public.announcement_reads for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy reads_insert on public.announcement_reads for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.announcements a where a.id = announcement_id and public.can_see_announcement(a.audience, a.class_id))
);

-- threads: a parent with a staff member about one of the parent's children
create policy threads_read on public.threads for select to authenticated
  using (auth.uid() in (parent_id, teacher_id) or public.is_admin());
create policy threads_insert on public.threads for insert to authenticated with check (
  -- a parent opens a thread with a staff member about their own child ...
  ( parent_id = auth.uid() and public.is_guardian_of(student_id)
    and exists (select 1 from public.profiles p where p.id = teacher_id and p.role in ('teacher', 'admin')) )
  -- ... or a teacher (of that student) / the office opens one with that child's parent
  or ( teacher_id = auth.uid() and (public.teaches_student(student_id) or public.is_admin())
    and exists (select 1 from public.guardians g where g.parent_id = threads.parent_id and g.student_id = threads.student_id) )
);

create policy messages_read on public.messages for select to authenticated
  using (public.is_thread_member(thread_id) or public.is_admin());
create policy messages_send on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_thread_member(thread_id) and read_at is null);
create policy messages_mark_read on public.messages for update to authenticated
  using (public.is_thread_member(thread_id) and sender_id <> auth.uid())
  with check (public.is_thread_member(thread_id) and sender_id <> auth.uid());

-- grades and attendance: the class teacher writes, the family reads
create policy grades_read on public.grades for select to authenticated
  using (public.is_admin() or public.teaches_class(class_id) or public.is_guardian_of(student_id));
create policy grades_write on public.grades for all to authenticated
  using (public.is_admin() or public.teaches_class(class_id))
  with check (public.is_admin() or (public.teaches_class(class_id)
              and exists (select 1 from public.enrollments e where e.class_id = grades.class_id and e.student_id = grades.student_id)));

create policy attendance_read on public.attendance for select to authenticated
  using (public.is_admin() or public.teaches_student(student_id) or public.is_guardian_of(student_id));
create policy attendance_write on public.attendance for all to authenticated
  using (public.is_admin() or public.teaches_student(student_id))
  with check ((public.is_admin() or public.teaches_student(student_id)) and recorded_by = auth.uid());

-- document requests: families ask, the office decides
create policy docreq_read on public.doc_requests for select to authenticated
  using (public.is_admin() or public.is_guardian_of(student_id));
create policy docreq_insert on public.doc_requests for insert to authenticated with check (
  requested_by = auth.uid() and public.is_guardian_of(student_id)
  and status = 'submitted' and reject_reason is null and file_path is null
);
create policy docreq_admin_update on public.doc_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy events_read on public.events for select to authenticated using (public.my_role() is not null);
create policy events_admin on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- storage
-- Private bucket for issued PDFs: documents/<student_id>/<request_id>.pdf
-- Families download with signed URLs, which require read access below.
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy documents_read on storage.objects for select to authenticated using (
  bucket_id = 'documents'
  and (public.is_admin() or public.is_guardian_of(((storage.foldername(name))[1])::uuid))
);
create policy documents_admin_write on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.is_admin());
create policy documents_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'documents' and public.is_admin()) with check (bucket_id = 'documents' and public.is_admin());
create policy documents_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and public.is_admin());

-- ---------------------------------------------------------------- realtime
-- new messages arrive live (Supabase Realtime respects RLS)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
