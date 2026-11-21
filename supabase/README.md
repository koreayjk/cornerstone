# Supabase (Family Portal back end)

Build-plan step 3. The schema, Row Level Security (RLS) policies and storage rules live in
`migrations/` and are the source of truth. Nothing here is connected to the live demo yet;
`portal/` still runs on in-memory demo data.

| File | What it is |
|---|---|
| `migrations/20261121000000_init.sql` | Tables, helper functions, triggers, grants, RLS policies, private `documents` bucket, realtime for messages |
| `seed.sql` | **Fictional** demo data for local development only (5 accounts, 3 students). Never load it into production. |
| `tests/rls_test.sql` | Signs in as each role and checks what it can read and write |
| `tests/supabase_stub.sql` | Minimal stand-in for Supabase's `auth` and `storage` schemas so the tests run on plain PostgreSQL |
| `tests/run.sh` | Builds a throwaway database and runs the tests (also runs in CI) |

## Who can see what

| | Parent | Teacher | Office (admin) |
|---|---|---|---|
| Students, guardians | own children | students in own classes | all |
| Notices | school-wide + own children's divisions, International (if a child is international), own children's classes | all; posts school-wide or to own class | all; posts anywhere |
| Messages | own threads | own threads | all (read) |
| Grades, attendance | own children (read) | own classes (read/write) | all |
| Document requests | own children (create, read) | — | all (review, issue, reject) |
| Issued PDFs (`documents` bucket) | own children, via signed URL | — | all (upload) |

Also enforced in the database:
- Request status only moves forward: Submitted → In review → Ready, or → Rejected with a reason.
- A digital request needs its PDF before it is Ready.
- Scores must be 0–100.
- Nobody can change their own role or email from the browser.
- A signed-in user who was not invited (no profile) sees nothing.

## Setting up a project (when Moses approves)

1. Create a Supabase project. In **Authentication → Providers → Email**, turn **off** "Allow new users to sign up". The portal is invitation-only.
2. Apply the migration: `supabase link --project-ref <ref>` then `supabase db push`. You can also paste the migration into the SQL editor.
3. Put the project URL and the **anon** key in `js/supabase.js`. The service-role key never goes in the repo.
4. Invitations: the office invites people with the Auth admin API (`inviteUserByEmail`), called from a small Edge Function that runs with the service role.
   - The function sets `app_metadata.role` (`parent` / `teacher` / `admin`) and `user_metadata.full_name` / `lang`.
   - The `on_auth_user_created` trigger then creates the profile.
   - The office links parents to students in `guardians`.
5. Customise the email templates in **Authentication → Email templates** (see the portal demo's "Email notifications" preview).

## Running the tests

```bash
# any empty PostgreSQL 15+ database
DATABASE_URL=postgres://postgres@localhost:5432/postgres supabase/tests/run.sh
```

CI runs the same against a fresh `postgres:16` container on every pull request.
