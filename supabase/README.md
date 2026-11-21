# Supabase (Family Portal back end)

Build-plan step 3. The schema, Row Level Security (RLS) policies and storage rules live in
`migrations/` and are the source of truth. Nothing here is connected to the live demo yet;
`portal/` still runs on in-memory demo data.

| File | What it is |
|---|---|
| `migrations/20261121000000_init.sql` | Tables, helper functions, triggers, grants, RLS policies, private `documents` bucket, realtime for messages |
| `migrations/20261121010000_profile_from_app_metadata.sql` | Creates the profile when the role is set after the invite, and keeps role changes in sync |
| `functions/invite-user/` | Edge Function the office calls to invite someone: checks that the caller is an admin, validates the request (`validate.js`, unit-tested), sends the invitation, sets the role, links students |
| `templates/*.html` | Auth emails (invitation, sign-in link, password reset), each in en/ko/zh/es, chosen by `user_metadata.lang` |
| `config.toml` | Local CLI config: sign-up disabled, email templates |
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
4. Deploy the invitation function and set its secret:
   ```bash
   supabase functions deploy invite-user
   supabase secrets set PORTAL_URL=https://<domain>/portal/
   ```
   - The portal calls `sb.functions.invoke('invite-user', { body: { email, full_name, role, lang, student_ids } })` while signed in as office staff.
   - The function sends the invitation, sets `app_metadata.role`, and links the parent to their students. The `on_auth_user_role_changed` trigger creates the profile.
   - The service-role key stays inside the function.
5. Email templates: paste `templates/invite.html`, `magic_link.html` and `recovery.html` into **Authentication → Email templates**. Use the subjects from `config.toml`.

## Running the tests

The Edge Function's validation and the email templates are covered by `tests/edge.spec.js` (Playwright). The function itself type-checks with `deno check supabase/functions/invite-user/index.ts`.


```bash
# any empty PostgreSQL 15+ database
DATABASE_URL=postgres://postgres@localhost:5432/postgres supabase/tests/run.sh
```

CI runs the same against a fresh `postgres:16` container on every pull request.
