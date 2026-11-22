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

- Static multi-page site, Apple-style cinematic design: `index.html` (home) plus five section pages (`about/`, `academics/`, `enrichment/`, `admissions/`, `student-life/`), a `404.html`, and the Family Portal demo at `portal/`. CSS and JS live in `css/` and `js/` (see §3); there is no build step.
- Every public page and the portal are available in English, Korean, Chinese (Simplified) and Spanish.
- Favicon (`img/favicon.svg`, `img/apple-touch-icon.png`) and share previews (Open Graph tags + `img/og.jpg`, 1200×630) are on every page.
- `img/0.jpg`–`img/8.jpg`: AI-generated atmosphere images (Higgsfield, GPT Image).
- `img/v0.mp4` (hero campus walk, golden hour) and `img/v1.mp4` (athletics slow-motion basketball): AI-generated videos (Higgsfield, Seedance 2.5, 10s, 720p, no audio).
- The Family Portal exists only as a **front-end demo** with in-memory fake data (resets on reload). It demonstrates three roles (parent, teacher, admin), a parent with two children, teacher grade entry and daily attendance that the family sees immediately, the office's invitation flow (invite → email → accept and set a password; there is no public sign-up), email notification previews in the recipient's language, the document-request flow including rejection, and calendar export (.ics / Google Calendar). Letter grades follow the 2026-27 Student Handbook: grades 1–5 A+ 97, A 94, A- 90, B+ 87, B 84, B- 80, C+ 77, C 74, C- 70, D 66, F below; grades 6–12 A 90, B 80, C 70, F below 70. Supabase (build-plan steps 3–5) is not connected yet.
- A gold bottom banner reads "Design proposal … not the official school website" and `<meta name="robots" content="noindex,nofollow">` is set. **Keep both until the school approves the official launch.**

### Image map
| File | Content | Used in |
|---|---|---|
| img/0.jpg | Brick church-school at golden hour, students walking | Hero poster |
| ~~img/1.jpg~~ | Removed: chapel with crucifix, not appropriate for a Church of Christ school. Do not reintroduce. | — |
| img/2.jpg | Hands underlining a Bible | Upper School tile, portal |
| img/3.jpg | Teacher helping a student in a small classroom | Middle School tile, portal welcome |
| img/4.jpg | Girls' basketball, black and gold uniform | Athletics poster |
| img/5.jpg | Graduation caps at sunset | "Sent." section |
| img/6.jpg | Teacher and young child reading | Lower School tile |
| img/7.jpg | International students laughing on campus steps | International section |
| img/8.jpg | Plain Protestant chapel with a pulpit and an open Bible, light rays | Chapel scroll scene, Faith & Service tile, teacher portal welcome |

**Photo gallery** (`student-life/#gallery`, `js/gallery.js`): 69 real photos from the school's previous website (2012–2022), stored as `img/gallery/NN.avif|webp` (1000px long edge, metadata stripped, numbered with no names). Moses approved including students' faces (2026-11-22). Never put student names in file names, alt text or captions. <!-- VERIFY: school confirms photo consent before launch -->

`img/welcome-back.mp4` (+ `img/gallery/welcome.avif|webp` poster): the school's own "Welcome Back!" video (2022, iMovie slideshow with sound), shown in the gallery and loaded only when played. It is not used as a background loop because of its title cards.

**Real photos on the section pages** (`img/real/<slug>-800|1200|1344.avif|webp`, generated from the old site's originals, metadata stripped): the five section-page heroes (`hero-<page>`, 1344×752 crops) and the photos inside sections (`.pics`, one or two per section; chapel uses a 4:5 crop). Each photo is used once. Regenerate from the originals rather than upscaling the 1000px gallery files.
All real photos (sections, heroes and gallery) share one colour grade, `tools/photos/grade.py` (white balance, softer saturation, filmic S-curve with matte blacks, warm highlights, vignette), so phone snapshots from different years read as one set. `tools/photos/realimg.py` (crops: heroes 1344:752, `pic` 4:3, `wide` 16:10, `tall` 4:5, each tightened 6–12%) and `tools/photos/gallery.py` rebuild them from the old site's originals (download them via `/wp-json/wp/v2/media`). A pair of photos is laid out editorially: a large 4:3 one and a taller crop of the second at the same height (use `object-position` when the subject sits off-centre).

⚠️ All other images and videos (home page, school-division tiles, the International section, the portal) are AI-generated placeholders. Before the official launch, replace them with **real school photography** shot to the same compositions. Never present AI images as real students of the school.

## 3. Hosting and architecture

- **Hosting**: GitHub Pages (static). The site is served under the subpath `/cornerstone/`, so use **relative asset paths** (`img/x.jpg`), never root-absolute paths (`/img/x.jpg`).
- **Back end for the portal**: **Supabase** (Auth + Postgres + Storage), called directly from the browser with the **anon key** and protected by **Row Level Security**. GitHub Pages cannot run server code.
- **Never commit secrets.** Only the Supabase URL and anon key may appear in front-end code. The service-role key never goes in the repo. Admin-only actions go through RLS policies or Supabase Edge Functions.
- **Suggested structure** (move away from the single file step by step; no framework is required):
  ```
  /index.html            public site (home)
  /about/ /academics/ /enrichment/ /admissions/ /student-life/   section pages (index.html each)
  /portal/index.html     Family Portal (login + app)
  /css/base.css          shared tokens, reset, brand, toast (loaded by both pages)
  /css/site.css          public site styles
  /css/portal.css        portal styles
  /js/common.js          shared helpers ($, $$, toast)
  /js/layout.js          shared nav (dropdowns), mobile menu, sub-nav and footer for all public pages; MENU config mirrors the old site menu
  /js/site.js            scroll effects, reveal, video handling
  /js/i18n.js            shared i18n engine (site + portal; dictionary folder via data-dict)
  /js/i18n/              public-site dictionaries (en/ko/zh/es .json)
  /js/portal/*.js        portal modules (auth, notices, messages, grades, documents, i18n)
  /js/supabase.js        client init (URL + anon key only)
  /img/                  images and videos
  /supabase/migrations/  SQL schema + RLS policies (source of truth)
  ```
- If the build grows, Vite with `base: '/cornerstone/'` deployed to Pages through GitHub Actions is acceptable. Ask Moses before adding a framework.
- **Large media**: the videos are about 5 MB each. Keep the total repo size reasonable, compress new videos (H.264, `-preset veryfast`, CRF 26–28, 720p), and always give a video a poster image. The background videos sit on top of a `<picture>` (or a lazy `.img` background) that acts as the poster; don't add a `poster` attribute as well, because it can't offer AVIF and would download the same photo twice.
- **Images**: originals are `img/N.jpg` (1344×752). Pages use generated `img/N-800|1344.avif` and `.webp` variants (AVIF q55, WebP q80; the hero `0-1344.webp` is q72). Heroes use `<picture>` with `sizes` that account for `cover` on tall screens; other photos use `data-bg="img/N.jpg"`, and `js/site.js` picks the format and size. When adding or replacing a photo, regenerate all four variants.

### Section pages and the old site menu
The public site mirrors the old WordPress menu (About, Academics, Enrichment, Admissions, Student Life) as five pages; each sub-menu item is a section (`#id`) on that page. `MENU` in `js/layout.js` drives the nav dropdowns, the mobile menu and each page's sticky sub-nav.
Items marked `ready: false` have no source content yet and are hidden: Faculty and Staff (the old site's page is empty and its staff photos date from 2014–2018; needs a current staff list).
Kindergarten, Grades 1-5, Upper Grades, Art and Computer Lab are condensed from the old site's pages (2016–2023) <!-- VERIFY: curriculum titles still current -->; Upper Grades graduation credits come from the 2026-27 handbook. Employment points to the office because the old site's application forms list an outdated College Station address.
The 2026-27 School Calendar (Student Life, and the portal's events) comes from the school's calendar PDF (`files/calendar-2026-27.pdf`). Music & Band and Electives & Clubs (Enrichment) and the parent testimonial on Admissions come from the old site (2013–2019) <!-- VERIFY: still current -->.
Tuition, Handbook, Supply Lists, Uniforms, Board, Field Trips and Fundraisers come from the school's 2026-27 documents (tuition sheet, Student Handbook, supply lists), which are published in `files/` (PDF) and linked from the pages. When the school issues new versions, replace the PDFs and update the numbers. To add one: get the original text/files from the school or Moses (the old site's WordPress API, `/wp-json/wp/v2/pages` and `/media`, has worked from the cloud since 2026-11-22), add the `<section class="sec" id="…">` to the page, add its keys to all four dictionaries, and remove `ready: false`. Never invent tuition amounts, staff names or dates.

### Automated checks
`npx playwright test` (after `npm install`) starts a static server and checks, on desktop 1440px and mobile 390px:
- every public page and the 404 page in all four languages: no JS errors, no 404s, no horizontal overflow, no untranslated keys, and an axe-core accessibility audit;
- every internal link and `#anchor`, and that photos load as AVIF/WebP;
- the portal: every role, view and child in all four languages; rejection flow; per-child and per-staff threads; `.ics` export;
- search in all four languages;
- dictionaries: identical keys, HTML tags and `{placeholders}` across languages, and that every key the code uses exists.
`.github/workflows/ci.yml` runs the same on every pull request and on pushes to `main`, plus a `database` job that builds the schema on PostgreSQL 16 and runs the RLS tests (`supabase/tests/run.sh`). Run it before merging; add a test when you add a feature. The Playwright version is pinned to match the browser pre-installed in the cloud environment.

## 4. Design system (do not drift)

- **Direction**: Apple-style cinematic. The page should feel like watching a film. Photos are part of the screen, not boxes on a page. Text is minimal.
- **What to avoid**: anything that looks AI-made or templated, such as serif + gold + navy combinations, emoji icons, busy cards, or long paragraphs.
- **Colors**: black `#000` / `#0A0A0B` and light gray `#F5F5F7` sections that alternate. Text `#F5F5F7` on dark and `#1D1D1F` on light. Muted `#6E6E73` / `#A1A1A6`. **School gold** `#C9A13B` / `#E3C46E` is used **only as an accent**.
- **Type**: `Inter Tight` 600 for display (tight tracking, -0.035 to -0.05em). `Inter` for body. Both are self-hosted in `fonts/` (variable 400–700, Latin subset, SIL OFL; `@font-face` in `css/base.css`, preloaded in each page head). This replaced the Google Fonts stylesheet, which blocked first paint.
  - Per language (stacks in `css/base.css` via `--serif`/`--sans`; never hard-code a family name): Korean uses **Pretendard** (jsDelivr, dynamic subset), Chinese uses **Noto Sans SC** (Google Fonts, variable 400–700). `js/i18n.js` loads a CJK font only when that language is selected; en/es download nothing extra.
- **Motion**:
  - Hero: autoplay muted loop video with headline lines that rise in.
  - Statement: words light up one by one as you scroll; "wisdom / stature / favor" light up in gold.
  - Chapel scene: sticky section where the image zooms out and three captions appear in sequence.
  - `.rv` reveal on scroll.
  - Respect `prefers-reduced-motion`.
- **Components**: pill buttons, 22–28px radius tiles, a horizontal snap scroller for school divisions, and a thin translucent fixed nav (52px).
- **Logo**: the school's seal is a black shield with a gold budded (botonnée) cross. The site currently uses an SVG redraw (`#crest` symbol). Swap in the official logo file when the school provides it.
- **Mobile first**: test at 390px. Nothing may overflow horizontally. The portal uses a bottom tab bar on mobile.
- **Language**: the public site and the portal both support **English / Korean / Chinese (Simplified) / Spanish** (`en`, `ko`, `zh`, `es`), with a picker in the site nav and the portal top bar. The choice is shared (localStorage `cca.lang`). English stays in the HTML as the default; translations live in `js/i18n/<lang>.json` (site) and `js/portal/i18n/<lang>.json` (portal), and every dictionary must keep the same keys as its `en.json`. Proper names (school name, Cognia, SACS, TCAL, Blinn College, Texas A&M…) stay in English. Many international families are Korean; Spanish serves local Texas families.

## 5. School facts (verified from the old site; re-confirm before launch)

- Full name: Brazos Valley Cornerstone Christian Academy. Mascot: **Cougars**. Colors: black and gold.
- 3200 Cavitt Avenue, Bryan, TX 77801 (meets in the Cavitt Church of Christ building) · (979) 694-8200 · office@bvcca.com
- Mission: students "grow in wisdom and stature, and in favor with God and man." The site uses **Luke 2:52 ESV** wording: "And Jesus increased in wisdom and in stature and in favor with God and man." Use the **ESV** for all Scripture in English. In translations use: Korean 개역개정, Chinese 和合本 (CUV), Spanish RVR1960 <!-- VERIFY: confirm versions with the school -->.
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
- Student life: Cool Cougar of the Week, the Bee Kind People Project, the Bob & JoAnn Walker Day of Service (January), Messiah's Ranch, and PACK (Parent Association of Cornerstone Kids).
- From the 2026-27 Student Handbook: school day 8:00 AM–3:15 PM (K–5 core until 1:45 PM); doors open 7:30 AM; drop-off/pick-up on Willow Street; extended care 3:30–5:30 PM at $7.50/hour; Board: Trey Marchbanks (President), Clay Bassham (Vice-President), Joe Hays, Meriden Warden, Marcia Crouch.
- Tuition 2026-27 (school's tuition sheet): registration $350 (Plan I) / $300 (Plan II) / $175 (Plan III); 5% discount for a year paid in advance, 4% for a semester (deadline August 1). The footnotes for Plan II "*" and Plan III "**" are unknown <!-- VERIFY -->.
- The 2026-27 application form lists bvccaoffice@gmail.com, while the site uses office@bvcca.com <!-- VERIFY: which address the office wants published -->.
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
7. **i18n**: a language picker (EN / KO / ZH / ES) for every portal UI string. Dictionaries live in `js/portal/i18n/<lang>.json` and must keep identical keys; `js/portal/i18n.js` handles lookup, plurals and date formatting (`Intl`). Store enumerations as codes (category, audience, doc type, status) and translate at render time. Announcements and events may carry optional per-language translations; people's free text (messages, purposes) is shown as written. Issued official documents stay in English.
8. **Notifications** (later): email on new announcements, messages and documents ready.

### Data model (starting point)
```
profiles(id uuid pk = auth.users.id, role text check in ('parent','teacher','admin'), full_name, email, lang default 'en')
students(id, first_name, last_name, grade, student_code, dob, entered_on, is_international bool)
guardians(parent_id → profiles, student_id → students)            -- parent ↔ child
classes(id, name, division, teacher_id → profiles)
enrollments(student_id, class_id)
announcements(id, author_id, title, body, translations jsonb default '{}', audience, category, created_at)  -- translations: {"ko":{"title","body"},"zh":{...},"es":{...}}
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
3. **Supabase setup**: schema and RLS migrations in `/supabase/migrations`, seed data (demo students, a parent, a teacher), and `js/supabase.js`. ✅ files done and tested (`supabase/tests/run.sh`, also in CI); **not yet applied to a live project** — see `supabase/README.md` for the setup steps (disable public sign-up, invitations via an Edge Function setting `app_metadata.role`).
4. **Auth and roles**: login, logout, a role-based nav, and invitation flow documentation. Ready: `supabase/functions/invite-user` (Edge Function, type-checked), Auth email templates in four languages (`supabase/templates`), `supabase/config.toml` with sign-up disabled. Remaining: wire the portal UI to Supabase once a project exists.
5. **Announcements**, then **Messages**, then **Grades & Attendance**, then **Document requests + PDF**.
6. **EN/KO/ZH/ES i18n** across the portal. ✅ done for the demo (dictionaries + picker).
7. **Polish**: ✅ done (axe-core: 0 violations on the site and every portal view).
   - Accessibility: focus states, alt text, contrast. Use `--gold-ink` (#8A6A1F) for gold text on light backgrounds and dark text (#111) on gold fills; plain `--gold` text on light fails WCAG AA.
   - Performance: lazy-load images, compress videos.
   - Mobile QA at 390px.
8. **Launch prep** (only when Moses says the school approved):
   - Remove the proposal banner and noindex (on both `index.html` and `portal/index.html`), and set the footer's bottom padding back to 30px in `css/site.css`.
   - Connect a custom domain, and update the absolute `og:url` / `og:image` URLs in every page head (they point at koreayjk.github.io/cornerstone).
   - Replace the AI media with real photography.

## 8. Working rules for Claude

- Answer and summarize for Moses **in Korean**, concisely. Code, comments and commit messages are in English.
- Before large changes (a framework, the schema, a new dependency), state the plan in 3–5 lines and wait for approval.
- Keep the design identical when refactoring. Check desktop (1440px) and mobile (390px) after UI changes.
- Never put children's real personal data in seed data or commits. Use clearly fake demo data.
- Never commit `.env`, service-role keys or real credentials. Add a `.gitignore` for `.env*`.
- After each step, report: what changed, how to test it, and what is next.
- **Merge automatically** (Moses's standing instruction): when a step is finished and tested, commit, push, open a PR to `main` and merge it right away — do not ask first. If `main` moved, merge `origin/main` into the branch before opening the PR. Then report the PR link.
