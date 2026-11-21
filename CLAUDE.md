# CLAUDE.md — Cornerstone Christian Academy Website

> Read this file at the start of every session. It describes the project, the design rules, the facts about the school, and the build plan.

## 1. Project overview

- **What**: Website redesign + working **Family Portal** for Brazos Valley Cornerstone Christian Academy (BVCCA), a Christ-centered K–12 private school in Bryan, Texas.
- **Owner / developer**: Moses Yu (INTO Study Abroad Center / IM Mission Foundation Group Corp). This is a **design proposal** prepared as a partner of the school; it is not yet the official school site.
- **Repo**: `koreayjk/cornerstone` (GitHub)
- **Live preview**: https://koreayjk.github.io/cornerstone/ (GitHub Pages)
- **Current official site** (old, WordPress): http://www.cornerstone-christian-academy.com/
- **Development environment**: Claude Code on the web (cloud). Work only through the repo; commit small, logical changes with clear messages.

## 2. Current state

- `index.html`: single-file static site (HTML + inline CSS + inline JS), Apple-style cinematic design.
- `img/0.jpg`–`img/8.jpg`: AI-generated atmosphere images (Higgsfield, GPT Image).
- `img/v0.mp4` (hero campus walk, golden hour) and `img/v1.mp4` (athletics slow-motion basketball): AI-generated videos (Higgsfield, Seedance 2.5, 10s, 720p, no audio).
- The Family Portal exists only as a **front-end demo** with in-memory fake data (resets on reload).
- A gold bottom banner reads "Design proposal … not the official school website" and `<meta name="robots" content="noindex,nofollow">` is set. **Keep both until the school approves the official launch.**

### Image map
| File | Content | Used in |
|---|---|---|
| img/0.jpg | Brick church-school at golden hour, students walking | Hero poster |
| img/1.jpg | Chapel with crucifix (**do not use**: not appropriate for a Church of Christ school) | Faith & Service tile; replace with 8.jpg |
| img/2.jpg | Hands underlining a Bible | Upper School tile, portal |
| img/3.jpg | Teacher helping a student in a small classroom | Middle School tile, portal welcome |
| img/4.jpg | Girls' basketball, black and gold uniform | Athletics poster |
| img/5.jpg | Graduation caps at sunset | "Sent." section |
| img/6.jpg | Teacher and young child reading | Lower School tile |
| img/7.jpg | International students laughing on campus steps | International section |
| img/8.jpg | Plain Protestant chapel with a pulpit and an open Bible, light rays | Chapel scroll scene |

⚠️ All images and videos are AI-generated placeholders. Before the official launch, replace them with **real school photography** shot to the same compositions. Never present AI images as real students of the school.

## 3. Hosting and architecture

- **Hosting**: GitHub Pages (static). The site is served under the subpath `/cornerstone/`, so use **relative asset paths** (`img/x.jpg`), never root-absolute paths (`/img/x.jpg`).
- **Back end for the portal**: **Supabase** (Auth + Postgres + Storage), called directly from the browser with the **anon key** and protected by **Row Level Security**. GitHub Pages cannot run server code.
- **Never commit secrets.** Only the Supabase URL and anon key may appear in front-end code. The service-role key never goes in the repo. Admin-only actions go through RLS policies or Supabase Edge Functions.
- **Suggested structure** (move away from the single file step by step; no framework is required):
  ```
  /index.html            public site
  /portal/index.html     Family Portal (login + app)
  /css/site.css          public site styles
  /css/portal.css        portal styles
  /js/site.js            scroll effects, reveal, video handling
  /js/portal/*.js        portal modules (auth, notices, messages, grades, documents, i18n)
  /js/supabase.js        client init (URL + anon key only)
  /img/                  images and videos
  /supabase/migrations/  SQL schema + RLS policies (source of truth)
  ```
- If the build grows, Vite with `base: '/cornerstone/'` deployed to Pages through GitHub Actions is acceptable. Ask Moses before adding a framework.
- **Large media**: the videos are about 5 MB each. Keep the total repo size reasonable, compress new videos (H.264, `-preset veryfast`, CRF 26–28, 720p), and always set a `poster`.

## 4. Design system (do not drift)

- **Direction**: Apple-style cinematic. The page should feel like watching a film. Photos are part of the screen, not boxes on a page. Text is minimal.
- **What to avoid**: anything that looks AI-made or templated, such as serif + gold + navy combinations, emoji icons, busy cards, or long paragraphs.
- **Colors**: black `#000` / `#0A0A0B` and light gray `#F5F5F7` sections that alternate. Text `#F5F5F7` on dark and `#1D1D1F` on light. Muted `#6E6E73` / `#A1A1A6`. **School gold** `#C9A13B` / `#E3C46E` is used **only as an accent**.
- **Type**: `Inter Tight` 600 for display (tight tracking, -0.035 to -0.05em). `Inter` for body. Load both from Google Fonts.
- **Motion**:
  - Hero: autoplay muted loop video with headline lines that rise in.
  - Statement: words light up one by one as you scroll; "wisdom / stature / favor" light up in gold.
  - Chapel scene: sticky section where the image zooms out and three captions appear in sequence.
  - `.rv` reveal on scroll.
  - Respect `prefers-reduced-motion`.
- **Components**: pill buttons, 22–28px radius tiles, a horizontal snap scroller for school divisions, and a thin translucent fixed nav (52px).
- **Logo**: the school's seal is a black shield with a gold budded (botonnée) cross. The site currently uses an SVG redraw (`#crest` symbol). Swap in the official logo file when the school provides it.
- **Mobile first**: test at 390px. Nothing may overflow horizontally. The portal uses a bottom tab bar on mobile.
- **Language**: the public site is in English. The portal must support **English / Korean** (many international families are Korean).

## 5. School facts (verified from the old site; re-confirm before launch)

- Full name: Brazos Valley Cornerstone Christian Academy. Mascot: **Cougars**. Colors: black and gold.
- 3200 Cavitt Avenue, Bryan, TX 77801 (meets in the Cavitt Church of Christ building) · (979) 694-8200 · office@bvcca.com
- Mission: students "grow in wisdom and stature, and in favor with God and man." The site uses **Luke 2:52 ESV** wording: "And Jesus increased in wisdom and in stature and in favor with God and man." Use the **ESV** for all Scripture.
- History:
  - July 2001: about 40 Christians met to start the school.
  - August 18, 2002: opened with 11 kindergarten and pre-K students.
  - 2004–05: kindergartners in the national top 3% in total reading.
  - Smallest school ever accredited by SACS.
  - 2006: first Science Academy in Brazos County.
  - May 2015: first graduating class.
  - Graduates have gone on to Texas A&M, Harding University and Blinn College.
- Accreditation: Cognia / AdvancED (formerly SACS). Memberships: TCSA, NCSA, PSIA, TCAL, NHS, NJHS. Stanford Achievement Test results are in the top 10% nationally.
- Academics:
  - Core subjects in the morning; Bible, computers, Spanish, art, music and PE in the afternoon.
  - Middle school electives include Spanish, ASL, band and athletics.
  - Dual credit with Blinn College.
  - Daily chapel; Friday memory verses.
- Programs: traditional full day; part-day core (K–5); homeschool enrichment; extended care 7:30 AM and 3:30–5:30 PM.
- Admissions:
  - Year-round, as space allows; nonrefundable registration fee.
  - Required: documents, immunizations, and hearing/vision/spinal screening.
  - Interview with the principal or a board member.
  - **Free 3-day trial**.
- Athletics: Lady Cougars are back-to-back TCAL Class 2A state champions (2022, 60–30 over Marshall Christian). Sports: basketball, volleyball, football, cheer, baseball, track & field (some offered with BVCHEA).
- Student life: Cool Cougar of the Week, the Bee Kind People Project, the Joanne Walker Day of Service, Messiah's Ranch, and PACK (Parents Association for Cornerstone Kids).
- International: SEVP-certified, issues Form I-20 for F-1 students.
- **Do not invent** numbers, testimonials, staff names or awards. Mark anything unverified with `<!-- VERIFY -->` and list it in the PR or commit message.

## 6. Family Portal — target features

Roles: `parent`, `teacher`, `admin` (office staff). One parent account can link to several students.

1. **Auth**: Supabase email magic link or email + password. The portal is invitation-only: the admin creates or invites parents and teachers. There is no public sign-up.
2. **Announcements**: teachers and admins post them with an audience (All / Lower / Middle / Upper / International / a specific class) and a category (Academics / Event / Urgent / Community). Parents see only their audiences, with unread badges.
3. **Messages**: 1:1 threads between a parent and a teacher about a specific student. Show unread state; use realtime (Supabase Realtime) if possible.
4. **Grades and attendance**: teachers enter them; parents read only their own children's records.
5. **Document requests**:
   - Request types: Enrollment Verification, Certificate of Attendance, Transcript, Certified Report Card, Letter of Good Standing, Immunization Record copy, I-20 Support Letter.
   - Status flow: Submitted → In Review → Ready (or Rejected with a reason).
   - The admin approves and issues a PDF from a letterhead template, stored in Supabase Storage in a private bucket.
   - Parents download through **signed URLs**.
6. **Calendar**: school events, with an option to export to Google or Apple Calendar (.ics).
7. **i18n**: an EN/KO toggle for every portal UI string (JSON dictionaries). Announcements may have optional Korean text.
8. **Notifications** (later): email on new announcements, messages and documents ready.

### Data model (starting point)
```
profiles(id uuid pk = auth.users.id, role text check in ('parent','teacher','admin'), full_name, email, lang default 'en')
students(id, first_name, last_name, grade, student_code, dob, entered_on, is_international bool)
guardians(parent_id → profiles, student_id → students)            -- parent ↔ child
classes(id, name, division, teacher_id → profiles)
enrollments(student_id, class_id)
announcements(id, author_id, title, body, title_ko, body_ko, audience, category, created_at)
announcement_reads(announcement_id, user_id, read_at)
threads(id, student_id, parent_id, teacher_id, created_at)
messages(id, thread_id, sender_id, body, created_at, read_at)
grades(id, student_id, class_id, term, label, score, letter, updated_at)
attendance(id, student_id, date, status in ('present','absent','tardy','excused'))
doc_requests(id, student_id, requested_by, type, purpose, copies, language, delivery, note, status, reject_reason, file_path, created_at, updated_at)
events(id, title, starts_at, ends_at, location, audience)
```

**RLS principles**:
- A parent sees only rows tied to students linked to them in `guardians`.
- A teacher sees only their classes and their own threads.
- An admin sees everything.
- Every table has RLS enabled. Write the policies in migrations, and test each role.

## 7. Build plan (do in order; one PR or commit group per step)

1. **Split files**: extract CSS and JS from `index.html` into `/css` and `/js` without changing the look. Replace the `img/1.jpg` usage with an appropriate image.
2. **Portal page**: move the portal demo to `/portal/`. The public site's "Family Portal" buttons link there.
3. **Supabase setup**: schema and RLS migrations in `/supabase/migrations`, seed data (demo students, a parent, a teacher), and `js/supabase.js`.
4. **Auth and roles**: login, logout, a role-based nav, and invitation flow documentation.
5. **Announcements**, then **Messages**, then **Grades & Attendance**, then **Document requests + PDF**.
6. **EN/KO i18n** across the portal.
7. **Polish**:
   - Accessibility: focus states, alt text, contrast.
   - Performance: lazy-load images, compress videos.
   - Mobile QA at 390px.
8. **Launch prep** (only when Moses says the school approved):
   - Remove the proposal banner and noindex.
   - Connect a custom domain.
   - Replace the AI media with real photography.

## 8. Working rules for Claude

- Answer and summarize for Moses **in Korean**, concisely. Code, comments and commit messages are in English.
- Before large changes (a framework, the schema, a new dependency), state the plan in 3–5 lines and wait for approval.
- Keep the design identical when refactoring. Check desktop (1440px) and mobile (390px) after UI changes.
- Never put children's real personal data in seed data or commits. Use clearly fake demo data.
- Never commit `.env`, service-role keys or real credentials. Add a `.gitignore` for `.env*`.
- After each step, report: what changed, how to test it, and what is next.
