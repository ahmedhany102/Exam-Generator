# Online Examination System — Implementation Plan

This document is the single source of truth for the course project. It fixes the architecture, the file ownership, the data model, the access rules and the order in which work is merged. It contains no full implementation code on purpose: each member writes their own files, and the small snippets here only show the shape of what to write.

> Migration note: this plan describes the system after the in-place migration from the team's previous course project. The git history, the four working branches and the file skeleton were kept; the domain was replaced completely.

## How to Use This Plan with an AI Coding Assistant

> **Tell your AI assistant your name (Ahmed Hany, Ibrahim Lotfy, Ahmed Fayez, or Ibrahim Abduljawad) and your branch, and instruct it to strictly edit only the files listed under your name.**

- Open with your identity and scope, for example: "I am **Ahmed Fayez**, working on branch `member3`. Only edit files whose owner tag is Ahmed Fayez (member3). Do not modify any other file; if a change is needed elsewhere, tell me who owns it instead."
- The binding scope is Section 2 (folder tree, owner tag on every file line) plus your own checklist in Section 7. Everything else is read-only context for you.
- Shared files (`README.md`, `PLAN.md`, `.gitignore`, `.gitattributes`, `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/index.css`, `frontend/package.json`) are edited by **Ahmed Hany** only; ask before touching them.
- If the assistant proposes a change outside your scope, reply with the owner from Section 8.1 instead of making the edit.
- Never let the assistant rename a function listed in Section 7.1: those names are the contract the other three members code against.

## How to use this document

- Every member works **only** inside the files assigned to them in the tree in Section 2, on their own branch.
- The four owners are **Ahmed Hany** (`member1`), **Ibrahim Lotfy** (`member2`), **Ahmed Fayez** (`member3`) and **Ibrahim Abduljawad** (`member4`). Every owner tag in this document is a full name plus a branch.
- If you need something from another member's file, do not edit that file. Read the contract in this plan or ask in the group chat, then wait for the owner.
- Section 7 is your personal checklist. Work top to bottom; each task ends with a "Done when" line that tells you when to stop and commit.
- Section 8 is the integration order. Do not merge out of that order.
- Nothing here uses TypeScript, Redux, Zustand, a UI component library, a state machine or a second server. Plain JavaScript, plain CSS, plain SQL.

---

## 1. Project overview

### 1.1 Academic context

One system, three courses:

- **Web Development** — semantic HTML5, modular CSS3, JavaScript (ES6+), React 18 + Vite, protected routing, forms and validation.
- **Database** — Supabase/PostgreSQL, eight related tables, foreign keys, `unique` constraints, a signup trigger and one security-definer function.
- **Security** — password authentication through Supabase Auth, three-role Row Level Security, an append-only audit log, and a design where the answer key never reaches the student's browser.

The project is assessed as a course MVP. A documented limitation with a named fix scores better than a hidden one — that is what Section 9 is for.

### 1.2 Hard constraints

| Constraint | Why |
| --- | --- |
| No custom backend server | Supabase *is* the backend. Fewer moving parts, and RLS becomes the interesting security topic instead of a middleware file. |
| No TypeScript, no UI library, no Redux | Every line must be explainable in a live code review by a second-year student. |
| One CSS file per page/component | CSS fundamentals (flexbox, grid, variables) stay visible instead of hidden behind classes from a library. |
| A page never calls Supabase directly | All queries live in `services/`, so the data layer can be reviewed in one place. |
| One attempt per exam, enforced by the database | `unique(exam_id, student_id)` - a rule in the schema, not in the UI. |
| Students never read `options.is_correct` | MCQ integrity. Grading therefore happens inside the `submit_attempt` function. |
| Only the anon key in the browser | The `service_role` key bypasses RLS and must never leave the dashboard. |

### 1.3 Architecture

```
                 ┌───────────────────────────────────────────────┐
                 │        Browser - React 18 + Vite              │
                 │        http://localhost:5173                  │
                 │                                               │
                 │  pages/  ← components/ ← services/  utils/    │
                 │  App.jsx = route table + role redirect        │
                 └───────────────────────┬───────────────────────┘
                                         │
                     supabase-js over HTTPS, anon key + user JWT
                                         │
                 ┌───────────────────────▼───────────────────────┐
                 │              Supabase (only backend)          │
                 │                                               │
                 │  Auth        email + password, JWT, sessions  │
                 │  Postgres    profiles   subjects   exams      │
                 │              questions  options    attempts   │
                 │              answers    security_logs         │
                 │  RLS         student / doctor / admin rules   │
                 │  Functions   submit_attempt() - grading       │
                 └───────────────────────────────────────────────┘
```

Three rules that follow from this picture, and that the defence will ask about:

1. The browser holds only the anon key; therefore **RLS is the real access control**, not the hidden buttons.
2. Every role check exists twice: once in `<ProtectedRoute allow={[...]}>` for the interface, once in Postgres for the data.
3. Grading is the single server-side behaviour. It runs in `submit_attempt()` because a student may not read the answer key.

---

## 2. Folder and file tree

The tree is rooted at the repository root. The tag at the end of every file line is its owner - a full name plus a branch - and it is binding. Folder lines only describe the folder.

```text
online-exam-system/                                       <- repository root
├── README.md                                             Ahmed Hany (member1) - shared: setup + run commands
├── PLAN.md                                               Ahmed Hany (member1) - shared: this document
├── .gitignore                                            Ahmed Hany (member1) - shared
├── .gitattributes                                        Ahmed Hany (member1) - shared: line endings
├── database/                                             folder: SQL, run by hand in the Supabase SQL editor
│   ├── 01_schema.sql                                     Ahmed Hany (member1)
│   ├── 02_rls.sql                                        Ahmed Hany (member1)
│   └── 04_seed_exams.sql                                 Ibrahim Abduljawad (member4)
├── frontend/                                             folder: React + Vite single-page app
│   ├── package.json                                      Ahmed Hany (member1) - shared
│   ├── vite.config.js                                    Ahmed Hany (member1) - shared
│   ├── index.html                                        Ahmed Hany (member1) - shared
│   ├── .env.example                                      Ahmed Hany (member1)
│   └── src/
│       ├── main.jsx                                      Ahmed Hany (member1) - shared
│       ├── App.jsx                                       Ahmed Hany (member1) - shared: route table + role redirect
│       ├── index.css                                     Ahmed Hany (member1) - shared: tokens, reset, buttons, forms
│       ├── lib/
│       │   └── supabaseClient.js                         Ahmed Hany (member1)
│       ├── context/
│       │   └── AuthContext.jsx                           Ahmed Hany (member1)
│       ├── components/
│       │   ├── ProtectedRoute.jsx                        Ahmed Hany (member1)
│       │   ├── Navbar.jsx                                Ahmed Fayez (member3)
│       │   ├── Navbar.css                                Ahmed Fayez (member3)
│       │   ├── Loader.jsx                                Ahmed Fayez (member3)
│       │   ├── Loader.css                                Ahmed Fayez (member3)
│       │   ├── ProgressBar.jsx                           Ibrahim Lotfy (member2)
│       │   └── ProgressBar.css                           Ibrahim Lotfy (member2)
│       ├── services/
│       │   ├── securityLogService.js                     Ahmed Hany (member1)
│       │   ├── examsService.js                           Ibrahim Lotfy (member2)
│       │   ├── attemptsService.js                        Ahmed Fayez (member3)
│       │   ├── gradingService.js                         Ibrahim Abduljawad (member4)
│       │   ├── resultsService.js                         Ibrahim Abduljawad (member4)
│       │   └── profileService.js                         Ibrahim Abduljawad (member4)
│       ├── utils/
│       │   ├── filterExams.js                            Ibrahim Lotfy (member2)
│       │   ├── validateExam.js                           Ahmed Fayez (member3)
│       │   └── gradeExam.js                              Ibrahim Abduljawad (member4)
│       └── pages/
│           ├── Login.jsx      Login.css                   Ahmed Hany (member1)
│           ├── Register.jsx   Register.css                Ahmed Hany (member1)
│           ├── Exams.jsx      Exams.css                   Ibrahim Lotfy (member2)
│           ├── ExamDetails.jsx ExamDetails.css            Ibrahim Lotfy (member2)
│           ├── TakeExam.jsx   TakeExam.css                Ibrahim Lotfy (member2)
│           ├── MyResults.jsx  MyResults.css               Ibrahim Lotfy (member2)
│           ├── Profile.jsx    Profile.css                 Ibrahim Lotfy (member2)
│           ├── DoctorDashboard.jsx DoctorDashboard.css    Ahmed Fayez (member3)
│           ├── CreateExam.jsx CreateExam.css              Ahmed Fayez (member3)
│           ├── ManageExams.jsx ManageExams.css            Ahmed Fayez (member3)
│           ├── ExamResults.jsx ExamResults.css            Ahmed Fayez (member3)
│           ├── AdminDashboard.jsx AdminDashboard.css      Ibrahim Abduljawad (member4)
│           ├── ManageUsers.jsx ManageUsers.css            Ibrahim Abduljawad (member4)
│           ├── ManageSubjects.jsx ManageSubjects.css      Ibrahim Abduljawad (member4)
│           └── SecurityActivity.jsx SecurityActivity.css  Ibrahim Abduljawad (member4)
```

### 2.1 Responsibility per folder

**`database/`** — three plain SQL files, run once in numbered order in the Supabase SQL Editor. They are the only place the schema lives, so a reviewer can read the whole database from top to bottom. `01_schema.sql` creates the tables, the signup trigger and the grading function; `02_rls.sql` turns on Row Level Security and writes the role policies; `04_seed_exams.sql` inserts the demo data. There is no `03_*.sql`: this system stores no uploaded files, so there is no Storage bucket.

**`frontend/`** — a Vite React app with no aliases and no build tricks. `src/main.jsx` mounts the router, `src/App.jsx` is the route table plus the role redirect, `pages/` holds one file per route with its own CSS, `components/` holds small reusable pieces, `services/` holds every database call, `utils/` holds pure functions with no imports, `lib/` holds the single Supabase client, `context/` holds the single global state (session + role).

---

## 3. Routes (fixed)

| Path | Page file | Access | Purpose |
| --- | --- | --- | --- |
| `/login` | `pages/Login.jsx` | public | Sign in; the redirect afterwards depends on the role. |
| `/register` | `pages/Register.jsx` | public | Creates a **student** account only. |
| `/` | — | any signed-in | Reads the role and redirects to that role's home. |
| `/profile` | `pages/Profile.jsx` | any signed-in | Own name, email, role. |
| `/security` | `pages/SecurityActivity.jsx` | any signed-in | Own audit rows. |
| `/exams` | `pages/Exams.jsx` | student | Open exams, search + subject filter. |
| `/exams/:examId` | `pages/ExamDetails.jsx` | student | Rules, marks, "start exam". |
| `/exams/:examId/take` | `pages/TakeExam.jsx` | student | Timed exam, auto-submit. |
| `/my-results` | `pages/MyResults.jsx` | student | Own attempts and scores. |
| `/doctor/dashboard` | `pages/DoctorDashboard.jsx` | doctor | Counters and recent submissions. |
| `/doctor/create-exam` | `pages/CreateExam.jsx` | doctor | Dynamic exam + questions + options. |
| `/doctor/my-exams` | `pages/ManageExams.jsx` | doctor | Own exams, edit/delete. |
| `/doctor/exams/:examId/results` | `pages/ExamResults.jsx` | doctor | All students' scores for one exam. |
| `/admin/dashboard` | `pages/AdminDashboard.jsx` | admin | Counters and links. |
| `/admin/users` | `pages/ManageUsers.jsx` | admin | Roles, activate/deactivate. |
| `/admin/subjects` | `pages/ManageSubjects.jsx` | admin | Subjects CRUD. |
| `*` | — | — | Unknown URL redirects to `/`, which picks the role home. |

`App.jsx` already contains this table and must not be restructured. Every signed-in route is wrapped in `<ProtectedRoute>`, and the role-restricted ones also pass `allow={['student' | 'doctor' | 'admin']}`. `ProtectedRoute` renders `<Loader message="Checking your session..." />` while `useAuth().loading`, then redirects to `/login` carrying `state={{ from: location.pathname }}`.

---

## 4. Data model and access contract

### 4.1 Tables

| Table | Columns (type) | Rules |
| --- | --- | --- |
| `profiles` | `id uuid PK → auth.users`, `full_name text`, `email text`, `role text`, `is_active bool`, `created_at timestamptz` | `role in ('student','doctor','admin')`, default `'student'` |
| `subjects` | `id uuid PK`, `name text`, `code text`, `doctor_id uuid → profiles`, `created_at` | `code unique` |
| `exams` | `id`, `subject_id → subjects`, `title`, `description`, `duration_minutes int`, `total_marks int`, `start_time`, `end_time`, `created_by → profiles`, `is_active bool`, `created_at` | `duration_minutes > 0`, `total_marks > 0` |
| `questions` | `id`, `exam_id → exams`, `question_text`, `marks int`, `order_index int` | `marks > 0` |
| `options` | `id`, `question_id → questions`, `option_text`, `is_correct bool` | exactly one correct per question (validated in `validateExam`) |
| `attempts` | `id`, `exam_id → exams`, `student_id → profiles`, `started_at`, `submitted_at`, `score int`, `status text` | `unique(exam_id, student_id)`; `status in ('in_progress','submitted','auto_submitted')` |
| `answers` | `id`, `attempt_id → attempts`, `question_id → questions`, `selected_option_id → options` | `unique(attempt_id, question_id)` |
| `security_logs` | `id`, `user_email text`, `event_type text`, `details text`, `created_at` | append-only; no foreign key on the email because a failed login has no user row |

Delete behaviour: every child table cascades from its parent, so deleting an exam removes its questions, options, attempts and answers in one statement.

### 4.2 Role policy matrix

| Table | Student | Doctor | Admin |
| --- | --- | --- | --- |
| `profiles` | read/update own row | read own row + names of students on own exams | full access (role, `is_active`) |
| `subjects` | read all | read all | read + write |
| `exams` | read only where `is_active` and inside `start_time`/`end_time` | full on `created_by = auth.uid()` | read all |
| `questions` | read for visible exams | full on own exams | read all |
| `options` | read `id, question_id, option_text` only - **never `is_correct`** | full on own exams | read all |
| `attempts` | read/insert own rows only | read rows of own exams | read all |
| `answers` | read own, insert via the RPC only | read answers of own exams | read all |
| `security_logs` | insert own events, read own events | same | same (plus read all if the admin view needs it) |

Two consequences worth saying out loud in the defence:

- A student who forces `/admin/users` in the browser sees an empty table, because the policy - not the router - decides. The router check only avoids a broken-looking screen.
- `options.is_correct` is unreachable from the student's session, so the score cannot be computed in the browser. That is why grading is an RPC.

### 4.3 Why grading is a Postgres function

The requirement "automatic grading" and the requirement "students can never read the answer key" cannot both be satisfied in JavaScript. The resolution:

1. `TakeExam.jsx` collects `[{ questionId, selectedOptionId }]`.
2. `attemptsService.submitAttempt()` calls `supabase.rpc('submit_attempt', { p_attempt_id, p_answers, p_auto_submitted })`.
3. `submit_attempt` (security definer) inserts the answers, compares each to `options.is_correct`, sums `questions.marks`, writes `attempts.score`, `submitted_at` and `status`, and returns `{ score, total, correct_count, question_count }`.
4. `utils/gradeExam.js` implements the same rule in JavaScript. It is not the grading path: it is the reference implementation used by the doctor's preview, by `gradingService.getExamTotalMarks()`, and by the offline checks that prove the SQL and the JS agree.

### 4.4 Query rules for services

- Every exported function that talks to the database returns `{ data, error }` and never throws.
- A page decides what to render from `error` and from an empty `data` array; that is how loading / empty / error states stay separate.
- The user id is read inside the service (`supabase.auth.getUser()`), never passed in from a page, so a page cannot accidentally query for somebody else.
- Columns are listed explicitly. `select('*')` is acceptable only where the whole row is genuinely needed (`exams`, `profiles`).

---

## 5. Exam flow and grading rules

### 5.1 The student flow, end to end

1. `Exams.jsx` → `examsService.getAvailableExams()` → cards with subject, duration, marks and status.
2. `ExamDetails.jsx` → `getExamById()` + `attemptsService.getOpenAttempt()`; if an attempt is still open, the button becomes "Continue exam"; if a submitted attempt exists, it becomes "Already attempted".
3. "Start" → `attemptsService.startAttempt(examId)` inserts the `attempts` row (`status: 'in_progress'`, `started_at: now()`). A duplicate is a `23505` unique violation; the service then returns the existing open attempt instead of failing.
4. `TakeExam.jsx` → `getExamQuestionsWithoutAnswers()` (no answer key), one question per screen with four options.
5. On every selection `saveAnswer()` upserts into `answers`, so a refresh loses nothing.
6. Submit (manual or by timeout) → `submitAttempt()` → RPC grades and closes the attempt → navigate to `/my-results`.
7. `MyResults.jsx` → `resultsService.getMyResults()` → score, percentage, pass/fail.

### 5.2 Timer, auto-submit and resume

- Deadline is **not** a client counter. It is `attempts.started_at + exams.duration_minutes`.
- On mount, `remaining = deadline - now`. That single formula gives both the countdown and resume-after-refresh for free: a refresh simply recomputes a smaller number.
- `setInterval` ticks once per second inside a `useEffect` whose cleanup calls `clearInterval`. A missing cleanup is the classic defence question and a real leak.
- When `remaining <= 0` the page submits once, with `autoSubmitted: true`, which stores `status = 'auto_submitted'`. A `useRef` guard prevents a double submit when the interval fires twice before the UI unmounts.
- If the tab was closed for longer than the exam duration, the deadline has already passed: submit immediately with whatever answers were saved.
- Answers already saved are still graded, so a timeout never destroys partial work.

### 5.3 Grading rule (MCQ only, the MVP)

```
score = Σ marks(q)   for every question q whose selected option has is_correct = true
total = Σ marks(q)   for every question q in the exam
percentage = round(100 * score / total)        // total > 0 by constraint
pass = percentage >= 50
```

Unanswered questions count as wrong, never as an error. The worked example the two implementations must reproduce:

| Question | Marks | Selected | Correct? | Points |
| --- | --- | --- | --- | --- |
| Q1 | 2 | B | yes | 2 |
| Q2 | 2 | A | no | 0 |
| Q3 | 3 | — | unanswered | 0 |
| Q4 | 3 | D | yes | 3 |
| Q5 | 2 | C | yes | 2 |
| **Total** | **12** | | | **7** |

`score = 7`, `total = 12`, `percentage = 58`, result **pass**. `exams.total_marks` must equal 12; `validateExam()` refuses the exam otherwise.

### 5.4 What "one attempt only" means in code

Three layers, in increasing strength: the button says "Already attempted" → `getOpenAttempt()` refuses to start a second one → `unique(exam_id, student_id)` rejects the insert even if the first two are bypassed. Only the third layer is security; the other two are courtesy.

---

## 6. Database setup and verification

### 6.1 Setup order

1. Create the Supabase project; copy the URL and anon key into `frontend/.env`.
2. Run `database/01_schema.sql` (tables, indexes, trigger, `submit_attempt`).
3. Run `database/02_rls.sql` (helper functions, RLS, policies).
4. Run `database/04_seed_exams.sql` (2 subjects, 2 exams, 5 questions each).
5. Authentication → Providers → Email → disable *Confirm email* for the demo.
6. Register three accounts (student, doctor, admin), then promote two of them with `update public.profiles set role = ...`.
7. Paste the four verification results from 6.5 into the pull request.

### 6.2 Column reference

See 4.1. Treat it as the contract: no page or service may invent a column that is not listed there.

### 6.3 Signup trigger (shape only)

```sql
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          new.email,
          'student');            -- hard-coded: never taken from the request
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`security definer` is essential: the insert happens before any session exists, so RLS would otherwise reject it. The hard-coded role is what stops a visitor from registering as a doctor.

### 6.4 RLS checklist

For every table: `alter table ... enable row level security;` then one policy per cell of the matrix in 4.2. Two helper functions keep the policies readable and avoid recursion:

```sql
create function public.current_role() returns text
  language sql stable security definer as $$
    select role from public.profiles where id = auth.uid();
$$;

create function public.owns_exam(p_exam_id uuid) returns boolean
  language sql stable security definer as $$
    select exists (select 1 from public.exams e
                   where e.id = p_exam_id and e.created_by = auth.uid());
$$;
```

Policies on `profiles` must call `current_role()` rather than querying `profiles` again - a policy that selects from its own table recurses and fails at insert time.

### 6.5 Two-user verification test

Run it after `02_rls.sql`, with three accounts, and record the result:

1. As the student: `select('is_correct').from('options')` → must be denied. This is the headline security result.
2. As the student: `select().from('attempts').eq('student_id', <other student id>)` → `[]`.
3. As the student: insert an attempt with `student_id` of somebody else → rejected by `with check`.
4. As the doctor: read attempts of an exam they did not create → `[]`.
5. As the doctor: update another doctor's exam → zero rows affected.
6. As the admin: read all profiles → allowed; the student doing the same → only their own row.
7. Signed out: read `exams` → `[]`; insert a `LOGIN_SUCCESS` row into `security_logs` → rejected (anon may only write `LOGIN_FAILED`).

If a step behaves differently, fix the policy, not the test.

---

## 7. Milestones

### 7.1 M0 — Kickoff (already in the repository)

Milestone names used across the project, matching the `TODO(Name, memberN - Milestone MN)` headers already in the files:

- **M0** — this migrated scaffold.
- **M1** — Ahmed Hany (`member1`): schema, RLS, auth, login/register, security log.
- **M2** — Ibrahim Lotfy (`member2`): exam list, exam details, timed exam, results, profile.
- **M3** — Ahmed Fayez (`member3`): attempts service, exam validation, shell components, doctor dashboard, exam creation, exam results.
- **M4** — Ibrahim Abduljawad (`member4`): grading, results service, profile service, admin pages, seed data, audit view.
- **M5** — integration, end-to-end test, defence rehearsal (Section 8).

Already complete in M0 — read it, do not rewrite it:

- `README.md`, `PLAN.md`, `.gitignore`, `.gitattributes`.
- `src/lib/supabaseClient.js` (single client + `isSupabaseConfigured`), `src/main.jsx`, `src/App.jsx` (route table, `RoleRedirect`, `HOME_BY_ROLE`), `src/index.css`.
- `src/context/AuthContext.jsx` is partly done: session loading, `onAuthStateChange`, `role` loading through `profileService.getProfile()`, `signOut`. Ahmed Hany adds `signIn`, `signUp`, `refreshRole`.
- `src/components/ProtectedRoute.jsx` with the `allow` role list; `Navbar`, `Loader`, `ProgressBar` working.
- Every `services/*` and `utils/*` file exists with its final name, signature and JSDoc; bodies throw `"... is not implemented yet (Name - memberN, Milestone MN)"`.
- Every page exists as a placeholder naming its owner and listing its TODOs.
- `database/01_schema.sql` and `02_rls.sql` document all eight tables, the trigger, the RPC and the full policy matrix.
- Branches `member1`–`member4`, all cut from the same `main` commit.

Function names fixed by the scaffold (use these exactly; a rename must update every caller and this table):

| File | Functions |
| --- | --- |
| `services/securityLogService.js` | Ahmed Hany (member1) — `logSecurityEvent({ eventType, details, email })`, `getMySecurityLogs()` |
| `services/examsService.js` | Ibrahim Lotfy (member2) — `getAvailableExams()`, `getExamById(examId)`, `getExamQuestionsWithoutAnswers(examId)` |
| `services/attemptsService.js` | Ahmed Fayez (member3) — `startAttempt(examId)`, `getOpenAttempt(examId)`, `saveAnswer(attemptId, questionId, selectedOptionId)`, `submitAttempt(attemptId, answers, options)` |
| `services/gradingService.js` | Ibrahim Abduljawad (member4) — `gradeAnswers(questions, answers)`, `getExamTotalMarks(questions)`, `calculatePercentage(score, total)` |
| `services/resultsService.js` | Ibrahim Abduljawad (member4) — `getMyResults()`, `getExamResultsForDoctor(examId)`, `getAttemptReview(attemptId)` |
| `services/profileService.js` | Ibrahim Abduljawad (member4) — `getProfile()`, `updateProfile(updates)`, `listUsers({ role })`, `updateUserRole(userId, role)`, `setUserActive(userId, isActive)` |
| `utils/filterExams.js` | Ibrahim Lotfy (member2) — `filterExams(exams, query, subjectId)`, `getExamStatus(exam, now)` |
| `utils/validateExam.js` | Ahmed Fayez (member3) — `validateExam(draft)`, `sumQuestionMarks(questions)`, `MCQ_OPTION_COUNT` |
| `utils/gradeExam.js` | Ibrahim Abduljawad (member4) — `gradeExam(questions, answers)` |

Rules for all four owners - Ahmed Hany (`member1`), Ibrahim Lotfy (`member2`), Ahmed Fayez (`member3`), Ibrahim Abduljawad (`member4`): one branch each, no direct commits to `main`, pull requests only after your own checklist is done and `npm run build` passes.

### Ahmed Hany — Team Lead, Database, Auth & Security (branch `member1`)

**Hard challenge: RLS + three roles + the signup trigger.** He does not own the admin pages, the profile page or the navbar.

1. [ ] Create the Supabase project; put the URL and anon key in `frontend/.env`; confirm the warning banner in `App.jsx` disappears.
   - Done when: `/login` renders and the banner is gone.
2. [ ] Write `database/01_schema.sql`: eight tables from 4.1 in dependency order, `unique(exam_id, student_id)`, `unique(attempt_id, question_id)`, the checks from 4.1, indexes on `exams(created_by)`, `attempts(exam_id)`, `attempts(student_id)`, `answers(attempt_id)`.
   - Done when: the Table Editor shows eight tables and the foreign keys point the right way.
3. [ ] Add the `handle_new_user` trigger and `submit_attempt(...)` (shape in 6.3 and 4.3) to the same file, then run it.
   - Done when: a new signup produces a `profiles` row with `role = 'student'`, and the RPC appears under Database → Functions.
4. [ ] Write `database/02_rls.sql`: `current_role()`, `owns_exam()`, RLS on all eight tables, one policy per matrix cell in 4.2, plus the narrowed `anon` INSERT for `LOGIN_FAILED`.
   - Done when: every table shows a policy, none shows "RLS disabled".
5. [ ] Extend `AuthContext.jsx` with `signIn(email, password)`, `signUp(email, password, fullName)` and `refreshRole()`, all writing to `security_logs` through `logSecurityEvent`.
   - Done when: a refresh keeps the user signed in and a promotion to doctor is visible after `refreshRole()`.
6. [ ] Implement `securityLogService.js` (`logSecurityEvent`, `getMySecurityLogs`); the writer must swallow its own error so a failed log never blocks a sign-in.
   - Done when: one row appears per event and the caller never receives an exception.
7. [ ] Build `Login.jsx` + `Login.css`: form, generic error message ("Email or password is incorrect"), `LOGIN_FAILED` on failure, redirect to `location.state?.from ?? '/'`.
   - Done when: a wrong password logs one `LOGIN_FAILED` row and reveals nothing about the account.
8. [ ] Build `Register.jsx` + `Register.css`: name/email/password/confirm, length + match validation, `signUp` with `options.data.full_name`, message explaining the student role.
   - Done when: registering creates an auth user and a `profiles` row with `role = 'student'` without a second insert.
9. [ ] Run the full verification in 6.5 and paste all seven results into the pull request.
   - Done when: step 1 (a student cannot read `is_correct`) and step 7 (anon can only log failures) both pass.

**Defence notes** — why the anon key is public and safe; how `onAuthStateChange` + a `loading` flag prevent the login flicker; why the trigger is `security definer` and hard-codes the role; why `options.is_correct` needs a view or column list instead of a policy hack.

### Ibrahim Lotfy — Student Exams & Timed Exam (branch `member2`)

**Hard challenge: timer + auto-submit + resume after a refresh.**

1. [ ] Implement `examsService.js`: `getAvailableExams()` (active, inside the time window, subject embedded), `getExamById(id)`, `getExamQuestionsWithoutAnswers(id)` (options without `is_correct`).
   - Done when: the console returns the seeded exams, and no call ever selects `is_correct`.
2. [ ] Implement `utils/filterExams.js` and `getExamStatus()` as pure functions.
   - Done when: an empty query returns everything, and one exam is "upcoming", "open" or "closed" correctly.
3. [ ] Build `Exams.jsx` + `Exams.css`: search box, subject filter, card grid, status badge, result count, empty state.
   - Done when: typing filters instantly with no refetch and clearing restores all cards.
4. [ ] Build `ExamDetails.jsx` + `ExamDetails.css`: exam info, rules, one-attempt notice, "Start exam" → `/exams/:examId/take`; tolerate `getOpenAttempt()` throwing until member3 lands.
   - Done when: a bad id shows "Exam not found" instead of a blank page.
5. [ ] Build the state machine of `TakeExam.jsx`: current index, `answers` array, progress line, next/previous, disable next until an option is chosen, `saveAnswer()` on each selection.
   - Done when: you can move back and forth and the saved answers survive a reload.
6. [ ] Add the timer: deadline from `attempts.started_at + duration_minutes`, one `setInterval` inside a `useEffect` with `clearInterval` cleanup, red style under 60 seconds.
   - Done when: refreshing mid-exam shows the correct remaining time and no interval survives navigation.
7. [ ] Add auto-submit at zero with a `useRef` guard, `autoSubmitted: true`, then navigate to `/my-results`.
   - Done when: letting the clock run out submits exactly once and the attempt shows `auto_submitted`.
8. [ ] Build `MyResults.jsx` + `MyResults.css` on `resultsService.getMyResults()`: exam, date, score/total, percentage bar, pass/fail badge, empty state.
   - Done when: a submitted attempt shows the same score the database holds.
9. [ ] Build `Profile.jsx` + `Profile.css`: read-only email and role badge, editable full name through `profileService.updateProfile`, no file upload anywhere.
   - Done when: the name survives a refresh and the role badge matches `profiles.role`.

**Defence notes** — why the deadline is computed from `started_at` instead of counting down a local number; what `clearInterval` leaks if you forget it; why students cannot fetch the answer key; how `unique(exam_id, student_id)` backs the "one attempt" rule.

### Ahmed Fayez — Doctor Dashboard & Exam Creation (branch `member3`)

**Hard challenge: the dynamic create-exam form.**

1. [ ] Implement `attemptsService.js` per 7.1, including the `23505` handling in `startAttempt()` and the `submit_attempt` RPC in `submitAttempt()`; explain in a comment why grading is not done here.
   - Done when: starting twice returns the same open attempt and a submit returns `{ score, total, correctCount, questionCount }`.
2. [ ] Implement `utils/validateExam.js` per 7.1 (four options, exactly one correct, marks sum equals `total_marks`).
   - Done when: a draft with 3 options, or with marks that do not add up, is rejected with a readable message.
3. [ ] Rewrite `Navbar.jsx` + `Navbar.css` with role-aware links and the log-out button.
   - Done when: each of the three roles sees only its own links and `NavLink` still highlights the active page.
4. [ ] Keep `Loader.jsx` + `Loader.css` working; update the owner header only.
   - Done when: no page is left without a loading state.
5. [ ] Build `CreateExam.jsx` + `CreateExam.css`: exam fields, a `questions` array in state where each item has four options and a `correctIndex`, add/remove question and option buttons, live mark total, `validateExam()` gate.
   - Done when: you can create an exam with 5 questions through the UI and the total marks equal the sum of the questions.
6. [ ] Insert in the right order in `CreateExam`: exam → questions (with `order_index`) → options; mark exactly one option correct.
   - Done when: the seeded and the created exams have identical shapes.
7. [ ] Build `ManageExams.jsx` + `ManageExams.css`: table of own exams, question count, status, links to results, delete with a confirmation.
   - Done when: deleting an exam also removes its questions, options and attempts (cascade).
8. [ ] Build `DoctorDashboard.jsx` + `DoctorDashboard.css` (counters, recent submissions, quick links) and `ExamResults.jsx` + `ExamResults.css` (per-exam table of students, score, status, average, pass rate).
   - Done when: a doctor sees only their own exams and their own students' rows.

**Defence notes** — why the insert order exam → question → option cannot be shortcut; why `correctIndex` lives in form state but `is_correct` lives in the database; how `validateExam` protects the mark total; why the doctor's result page is still filtered by RLS and not only by the query.

### Ibrahim Abduljawad — Automatic Grading + Admin + Seed Data (branch `member4`)

**Hard challenge: the grading engine.** Mostly simple CRUD otherwise.

1. [ ] Write `database/04_seed_exams.sql`: 2 subjects, 2 exams (different durations and totals), 5 questions each, 4 options each with exactly one correct, `order_index` 1..5, marks summing to `total_marks`, doctor ids looked up with a subselect.
   - Done when: `select count(*) from questions` returns 10 and `jsonb`-free sanity queries show exactly one correct option per question.
2. [ ] Implement `utils/gradeExam.js` exactly as 5.3, including unanswered questions counting as wrong.
   - Done when: the worked example returns `score 7 / total 12 / percentage 58` and never throws on missing answers.
3. [ ] Implement `gradingService.js` (`gradeAnswers`, `getExamTotalMarks`, `calculatePercentage`) on top of it.
   - Done when: `gradeAnswers(null, null)` returns zeros instead of an exception.
4. [ ] Implement `resultsService.js`: `getMyResults()`, `getExamResultsForDoctor(examId)`, `getAttemptReview(attemptId)`.
   - Done when: a student sees only their own attempts and a doctor only their own exams'.
5. [ ] Implement `profileService.js` with `getProfile`, `updateProfile`, `listUsers`, `updateUserRole`, `setUserActive`; no file-upload function may exist.
   - Done when: `AuthContext` receives the correct role and an admin can deactivate a student.
6. [ ] Build `AdminDashboard.jsx` + `AdminDashboard.css` and `ManageSubjects.jsx` + `ManageSubjects.css` (subjects CRUD, assign a doctor).
   - Done when: creating a subject with an existing code is refused with a readable message.
7. [ ] Build `ManageUsers.jsx` + `ManageUsers.css`: list, role filter, promote/demote, activate/deactivate, and the note that a doctor account is created by registering once and then promoting it.
   - Done when: a demoted doctor loses the doctor routes on the next sign-in, and RLS refuses their writes immediately.
8. [ ] Replace `SecurityActivity.jsx` + `SecurityActivity.css`: own audit rows, colour-coded badges per event type, empty state.
   - Done when: `LOGIN_FAILED`, `LOGIN_SUCCESS` and `EXAM_SUBMITTED` rows are readable and no other user's rows appear.
9. [ ] Compare `gradeExam.js` against the `submit_attempt` function on the seeded exam and paste both results into the pull request.
   - Done when: both produce the same score for the same answer set.

**Defence notes** — how the JS grader and the SQL function are kept identical; why `calculatePercentage` guards against a zero total; why admin actions are still constrained by RLS; why deactivating is safer than deleting a user.

---

## 8. Integration and final milestones

### 8.1 Merge and pull request order

Merge in this order; each step unblocks the next.

| Order | Branch | Owner | Depends on | Note |
| --- | --- | --- | --- | --- |
| 1 | `member1` | **Ahmed Hany** | nothing | Schema, RLS, auth. Everything else assumes a signed-in user with a role. |
| 2 | `member2` | **Ibrahim Lotfy** | `member1` (RLS, `AuthContext`) | Exam list and timer; needs the exams SELECT policy from Ahmed Hany. |
| 3 | `member4` | **Ibrahim Abduljawad** | `member1` (schema) | Grading, results, admin, seed. Runs in parallel with `member2`. |
| 4 | `member3` | **Ahmed Fayez** | `member1`, `member2`, `member4` | Doctor pages last: showing results needs exams and grading to exist. |

**Cross-owner dependencies in plain names:**

| Dependency | What one owner needs from the other | How to stay unblocked |
| --- | --- | --- |
| **Ibrahim Lotfy (member2)** needs **Ahmed Hany (member1)** | The `exams` SELECT policy and a working session | Code the queries against the column list in 4.1 and test as soon as `member1` merges. |
| **Ibrahim Lotfy (member2)** needs **Ibrahim Abduljawad (member4)** | `gradeExam()` / `getMyResults()` for the results page | Render `MyResults` with a local fake array until `resultsService` lands. |
| **Ahmed Fayez (member3)** needs **Ahmed Hany (member1)** | The doctor RLS policies on `exams`/`questions`/`options` and `submit_attempt` | Wrap `submitAttempt()` in a clear error state; the RPC name is fixed in 4.3. |
| **Ahmed Fayez (member3)** needs **Ibrahim Lotfy (member2)** | The exams list/navigation so the doctor pages have somewhere to link | Links are already in the route table; build the pages first. |
| **Ibrahim Abduljawad (member4)** needs **Ahmed Hany (member1)** | The schema, the `is_admin()` policy and `profiles.is_active` | Work against 4.1; the seed script only needs the table names. |
| **Everyone** needs **Ahmed Hany (member1)** for shared files | `README.md`, `PLAN.md`, `.gitignore`, `.gitattributes`, `App.jsx`, `main.jsx`, `index.css`, `package.json` | Ask; never edit a shared file on your own branch. |

Practical rules: keep `main` green (the app must start at every merge), rebase on `main` before opening the pull request, and never resolve a conflict by deleting somebody else's file.

### 8.2 End-to-end test script

Run after all four merges, with a student, a doctor and an admin account:

1. `npm run dev`, open `/`, sign in as the student → lands on `/exams`.
2. Filter by subject, open an exam, read the rules, start it.
3. Answer three questions, refresh the page → same answers, less time left.
4. Let the timer run out on a second exam → one `auto_submitted` attempt appears in `/my-results`.
5. Sign in as the doctor → create an exam with 5 questions → it appears in `/doctor/my-exams`.
6. As the student, take that new exam and submit before the deadline.
7. As the doctor, open `/doctor/exams/:examId/results` → the student's score matches what the student sees.
8. As the student, try `/admin/users` directly → redirected, and the console query returns only their own row.
9. As the admin, promote a student to doctor, deactivate them, and confirm the effect at their next sign-in.
10. Check `/security` for all three roles: each sees only their own events.

### 8.3 Security checks

- Student console: `select('is_correct')` on `options` → denied. Screenshot it for the report.
- Student console: insert an attempt for another student id → rejected.
- Doctor console: read another doctor's exam attempts → `[]`.
- Signed out: read `exams` → `[]`; write `LOGIN_SUCCESS` → rejected.
- `.env`, the bundle and the repo contain the anon key only - grep for `service_role` returns nothing.

### 8.4 Polish and documentation

- Every page: loading, empty and error state visible in the demo.
- `README.md` section 9 updated with anything that moved, `PLAN.md` section 9 updated with anything still missing.
- One consistent pass over the CSS: same spacing scale, same card style, no inline styles.

### 8.5 Rehearsal

- Each member demonstrates their own files for 3 minutes from the code, not from slides.
- Everyone answers the defence notes under their own checklist without notes.
- Ahmed Hany explains the architecture diagram in 1.3 end to end, including what happens to the anon key.
- Dry-run the RLS verification in 6.5 live: it is the hardest thing to fake and the most impressive thing to show.

---

## 9. Known limitations and assumptions

| Limitation | Impact | Mitigation or future work |
| --- | --- | --- |
| MCQ only | No short answers, no essays | Named in the requirements as an MVP scope; future work: a doctor-graded free-text type. |
| Timer runs in the browser | A determined student can pause the tab | The deadline is recomputed from `started_at` on every load, so pausing does not add time; a server-side `submitted_at` check is the future fix. |
| Grading is one SQL function | Harder to unit test than JS | `utils/gradeExam.js` mirrors it and member4 compares both results as evidence. |
| Doctor accounts are promoted, not created | Admin cannot create an auth user without the service key | Register once, then promote; documented in `ManageUsers.jsx`. A real product would use an admin API from a server. |
| No pagination | Fine at demo scale (10 questions, a handful of users) | Future work: `range()` paging and a full-text index. |
| Pass mark is a fixed 50% | Not configurable per exam | Documented; future work: add `pass_percentage` to `exams`. |
| Email confirmation disabled for the demo | Sign-ups are unverified | Required so the demo does not stall; production must re-enable it. |
| `is_active` on profiles is an addition to the original column list | Needed for "activate/deactivate users" | Documented here and in 4.1; dropping the feature would also drop the column. |

---

## 10. Run commands appendix

### 10.1 Frontend

```bash
cd frontend
npm install
cp .env.example .env        # Windows: Copy-Item .env.example .env
npm run dev                 # http://localhost:5173
npm run build               # must pass before every merge
```

### 10.2 Supabase SQL run order

```text
database/01_schema.sql      -> tables, indexes, signup trigger, submit_attempt()
database/02_rls.sql         -> helper functions, RLS, policies
database/04_seed_exams.sql  -> 2 subjects, 2 exams, 5 questions each
```

### 10.3 Demo layout

One browser window with three profiles (normal, private) or three browsers:

```text
student@test.local  -> /exams
doctor@test.local   -> /doctor/dashboard
admin@test.local    -> /admin/dashboard
```

No second terminal is needed: Supabase is hosted, and this repository has no server process.
