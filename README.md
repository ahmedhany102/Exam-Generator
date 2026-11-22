# Online Examination System (MVP)

A web system for conducting exams online, built for our **Web Development / Database / Security** course project. Three roles share one frontend:

- **Student** — sign in, see the exams that are open, take a timed multiple-choice exam, see the score immediately.
- **Doctor** — create exams with questions and four options each, set duration and total marks, follow every student's result.
- **Admin** — manage student and doctor accounts, and manage the subjects exams belong to.

The exam timer is enforced in the browser, the answers are graded on the server, and every role is separated by Postgres **Row Level Security**, so a student cannot read an answer key even with the browser console open.

> Migration note: this repository was migrated in place from the team's previous course project. The full git history and the `member1`–`member4` working branches were kept.

---

## 1. Architecture

```
┌──────────────────────────────────────┐
│   Frontend (React + Vite)            │
│   http://localhost:5173              │
│                                      │
│   pages/       one page per route    │
│   components/  Navbar, Loader, ...   │
│   services/    every database call   │
│   utils/       pure functions        │
└───────────────────┬──────────────────┘
                    │  supabase-js over HTTPS
                    │  anon public key + user JWT
                    ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase (the only backend)                                 │
│                                                              │
│  Auth        email + password, issues the JWT                │
│  Postgres    profiles, subjects, exams, questions, options,   │
│              attempts, answers, security_logs                 │
│  RLS         student / doctor / admin rules on every table    │
│  Functions   submit_attempt() - the only grading code path    │
└──────────────────────────────────────────────────────────────┘
```

**Decoupled architecture.** There is no custom backend server and no second API. The browser talks to Supabase directly with the *public anon key*, and Row Level Security decides row by row what that user may read or write. The one piece of server-side logic is the `submit_attempt` Postgres function, which exists because a student must never be able to read the correct answers.

---

## 2. Tech stack

| Layer | Technology | Why we chose it |
| --- | --- | --- |
| Frontend | React 18 + Vite, plain JavaScript (ES6+) | Fast dev server, no TypeScript to defend, components are easy to explain |
| Routing | `react-router-dom` | Real URLs, one `ProtectedRoute` wrapper with a role allow-list |
| Styling | Plain CSS3, one file per page/component | CSS fundamentals stay visible, no UI library hides them |
| Backend / DB | Supabase (Postgres + Auth) | BaaS: no server to deploy, and RLS is a real security topic |
| Grading | SQL function `submit_attempt` + `utils/gradeExam.js` reference | The answer key never reaches the student's browser |
| Security | Supabase Auth + RLS + input validation on every form | Three roles, three policy sets, one visible audit log |

State management: React `useState` + one `AuthContext`. **No Redux, no Zustand, no React Query** - deliberately, so every line stays explainable.

---

## 3. Repository layout

```
online-exam-system/
├── README.md                  <- this file (shared: Ahmed Hany, member1)
├── PLAN.md                    <- full technical plan + per-member checklist (shared)
├── .gitignore                 <- shared
├── .gitattributes             <- shared: line endings
├── database/                  <- SQL, run once in the Supabase SQL Editor, in order
│   ├── 01_schema.sql          Ahmed Hany (member1)
│   ├── 02_rls.sql             Ahmed Hany (member1)
│   └── 04_seed_exams.sql      Ibrahim Abduljawad (member4)
├── frontend/                  <- React app (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx           entry point, providers
│       ├── App.jsx            route table + role redirect (shared)
│       ├── index.css          global tokens, reset, buttons, forms
│       ├── lib/               supabaseClient.js (single client)
│       ├── context/           AuthContext.jsx (session + role)
│       ├── components/        Navbar, ProtectedRoute, Loader, ProgressBar
│       ├── services/          every Supabase call (no page talks to Supabase)
│       ├── utils/             pure functions (filter, validation, grading)
│       └── pages/             one .jsx + one .css per page
```

**Rule:** a page never calls `supabase` directly. It calls a function in `services/`. That keeps every query in one predictable place and makes the code review much easier to follow. Pure helpers (filters, validation, grading maths) live in `utils/` because they need no network at all.

---

## 4. Prerequisites

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | 18 or newer (LTS) | `node --version` |
| npm | ships with Node | `npm --version` |
| Git | any recent | `git --version` |
| Supabase account | free tier | <https://supabase.com> |

A code editor (VS Code recommended) and a browser with dev tools complete the setup. There is **no Python, no virtual environment and no second server** in this project.

---

## 5. Local setup

### 5.1 Clone and install

```bash
git clone <repository-url>
cd online-exam-system/frontend
npm install
```

### 5.2 Environment variables

```bash
# inside frontend/
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Open `frontend/.env` and fill in the two values from **Supabase Dashboard → Project Settings → API**:

| Variable | Where to find it | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Project URL | e.g. `https://abcd1234.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `anon` / `public` key | Safe in the browser - RLS protects the data |

> **Security note for the defence:** the `service_role` key must **never** appear in `.env`, in the bundle or in the repo. It bypasses RLS completely. Only the `anon` key ships to the browser.

### 5.3 Database

In the Supabase SQL Editor run the files **in this order**:

1. `database/01_schema.sql` — eight tables, foreign keys, the signup trigger, the `submit_attempt` function
2. `database/02_rls.sql` — enable RLS everywhere + the student / doctor / admin policies
3. `database/04_seed_exams.sql` — 2 subjects, 2 exams, 5 questions each, 4 options each

Then in **Authentication → Providers → Email**, disable *Confirm email* for the demo so the team can create test accounts instantly.

Finally promote one account to doctor and one to admin (needed by the demo):

```sql
update public.profiles set role = 'doctor' where email = 'doctor@test.local';
update public.profiles set role = 'admin'  where email = 'admin@test.local';
```

### 5.4 Run the frontend

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173>. If `.env` is still missing the app shows a yellow warning instead of crashing - that is expected.

There is nothing else to start. No API server, no worker, no Python process.

---

## 6. Environment variables summary

| File | Variable | Committed? |
| --- | --- | --- |
| `frontend/.env.example` | template only, fake values | yes |
| `frontend/.env` | real URL + anon key | **no** (git-ignored) |

Two variables, both Supabase, both public by design. `.gitignore` already excludes `node_modules/`, `.env`, `dist/`, `__pycache__/`, `.venv/` and `venv/`.

---

## 7. Team, branches and ownership

Four members, four long-lived branches, one owner per file. **A member only edits files listed under their own name** - this is what keeps the four pull requests conflict-free. Each member owns 8–9 files and exactly **one hard challenge**.

| Member | Name | Role | Branch | Owned files | Hard challenge |
| --- | --- | --- | --- | --- | --- |
| 1 | **Ahmed Hany** | Team Lead · Database, Auth & Security | `member1` | `database/01_schema.sql`, `database/02_rls.sql`, `src/lib/supabaseClient.js`, `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`, `src/services/securityLogService.js`, `src/pages/Login.jsx` + `.css`, `src/pages/Register.jsx` + `.css` | RLS + the three roles + the signup trigger |
| 2 | **Ibrahim Lotfy** | Student Exams & Timed Exam | `member2` | `src/services/examsService.js`, `src/utils/filterExams.js`, `src/components/ProgressBar.jsx` + `.css`, `src/pages/Exams.jsx` + `.css`, `src/pages/ExamDetails.jsx` + `.css`, `src/pages/TakeExam.jsx` + `.css`, `src/pages/MyResults.jsx` + `.css`, `src/pages/Profile.jsx` + `.css` | Timer + auto-submit + resume after a refresh |
| 3 | **Ahmed Fayez** | Doctor Dashboard & Exam Creation | `member3` | `src/services/attemptsService.js`, `src/utils/validateExam.js`, `src/components/Navbar.jsx` + `.css`, `src/components/Loader.jsx` + `.css`, `src/pages/DoctorDashboard.jsx` + `.css`, `src/pages/CreateExam.jsx` + `.css`, `src/pages/ManageExams.jsx` + `.css`, `src/pages/ExamResults.jsx` + `.css` | The dynamic create-exam form (add/remove questions and options) |
| 4 | **Ibrahim Abduljawad** | Automatic Grading + Admin + Seed Data | `member4` | `database/04_seed_exams.sql`, `src/services/gradingService.js`, `src/services/resultsService.js`, `src/services/profileService.js`, `src/utils/gradeExam.js`, `src/pages/AdminDashboard.jsx` + `.css`, `src/pages/ManageUsers.jsx` + `.css`, `src/pages/ManageSubjects.jsx` + `.css`, `src/pages/SecurityActivity.jsx` + `.css` | The grading engine |

**Shared files** (`src/App.jsx`, `src/main.jsx`, `src/index.css`, `README.md`, `PLAN.md`): routes already exist, so nobody needs to edit `App.jsx`. If a route really must change, ask **Ahmed Hany (Team Lead, member1)** first - he owns the merge.

Ownership map for the database tables:

| Table | Who reads / writes it | Owner of the SQL |
| --- | --- | --- |
| `profiles` | every role (own row), admin (all rows) | Ahmed Hany (member1) |
| `subjects` | everyone reads, admin writes | Ahmed Hany (member1) |
| `exams` / `questions` / `options` | doctors write their own, students read published ones | Ahmed Hany (member1) |
| `attempts` / `answers` | student writes own, doctor reads own exams' | Ahmed Hany (member1) |
| `security_logs` | every role writes its own events | Ahmed Hany (member1) |

---

## 8. Git workflow

**`main` is protected. Nobody pushes to `main` directly - not even the Team Lead.**

### 8.1 One branch per member

The four branches `member1` … `member4` already exist and point at the M0 commit. A member only switches to their own branch:

```bash
git checkout main
git pull
git checkout member1                      # member2 / member3 / member4 for the others
```

If a branch is missing (older clone), create it once from `main`:

```bash
git checkout -b member1
```

### 8.2 Daily loop

```bash
git add .
git commit -m "feat(exams): list open exams with subject filter"
git push -u origin member2
```

### 8.3 Commit message convention

`<type>(<scope>): <short description>`

| Type | Use for |
| --- | --- |
| `feat` | a new feature or page |
| `fix` | a bug fix |
| `style` | CSS / formatting only |
| `docs` | README, PLAN, comments |
| `db` | SQL schema, RLS or seed changes |
| `chore` | tooling, dependencies, config |

Examples: `feat(exam-timer): auto-submit when the countdown reaches zero`, `db(rls): deny students read access to options.is_correct`.

### 8.4 Pull Request rules

1. Target `main`, source your own `memberN` branch.
2. Title follows the same convention, e.g. `feat(create-exam): dynamic questions and options`.
3. Description states **what changed**, **how it was tested** (both roles), and **which files are touched**.
4. **One approving review** from a different member is required - the reviewer also runs the flow once.
5. Keep PRs small (one feature). A PR touching files you do not own is rejected.
6. Resolve conflicts locally with `git pull --rebase origin main` and push again.
7. Never rewrite history on a shared branch; `git push --force` is forbidden on `main`.
8. Before merging: `npm run build` in `frontend/` must succeed and the RLS check in `PLAN.md` §6.6 must still pass.

### 8.5 Stay up to date

```bash
git fetch origin
git rebase origin/main
```

Rebase keeps the history linear and avoids the "merge commit noise" that makes the final defence confusing.

### 8.6 Suggested merge order

1. `member1` - **Ahmed Hany** (schema + RLS + auth): everything else depends on it.
2. `member2` - **Ibrahim Lotfy** (student exams + timer) and `member4` - **Ibrahim Abduljawad** (grading + admin + seed) in parallel.
3. `member3` - **Ahmed Fayez** (doctor dashboard + exam creation) last, because showing results needs exams to exist.

---

## 9. What already exists at M0

This scaffold is the starting point on `main`. It builds and runs with placeholders so nobody starts from an empty file. Every placeholder names its owner and lists its TODOs in a header comment.

- [x] `README.md`, `PLAN.md`, `.gitignore`, `.gitattributes`
- [x] Frontend: Vite config, `App.jsx` with the full role-aware route table and `RoleRedirect`, `AuthContext` (session + role loading), `ProtectedRoute` with an `allow={['student']}` role list, `supabaseClient`
- [x] Every page as a placeholder that names its owner and lists its TODOs: `Login`, `Register`, `Profile`, `SecurityActivity`, `Exams`, `ExamDetails`, `TakeExam`, `MyResults`, `DoctorDashboard`, `CreateExam`, `ManageExams`, `ExamResults`, `AdminDashboard`, `ManageUsers`, `ManageSubjects`
- [x] Every service and util with its final name, signature and JSDoc, body throwing `"... is not implemented yet (Name - memberN, Milestone MN)"`
- [x] `database/01_schema.sql` and `database/02_rls.sql` documenting all eight tables, the signup trigger, the `submit_attempt` function and the full policy matrix
- [x] `ProgressBar`, `Loader`, `Navbar` working components
- [ ] Everything else - see the per-member checklists in `PLAN.md` section 7

`npm run build` succeeds on this scaffold, which means integration can start on day one.

---

## 10. Definition of done (per feature)

- The page renders and is reachable through a route in `App.jsx`.
- Data comes from Supabase through a function in `services/` - no hardcoded arrays left behind.
- Loading, empty and error states are all handled.
- The role that may not use the page is redirected, **and** the same action is refused by RLS if the URL is forced.
- CSS lives in that page's own file, using the variables in `index.css`.
- No `console.log` of a password, a JWT or an answer key.
- Tested with **two accounts** (a student and a doctor) plus one admin account.
- Comments explain *why*, not *what*, so every file can be defended line by line.

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Yellow "Supabase is not configured" banner | `frontend/.env` missing | copy `.env.example`, add the two keys, restart `npm run dev` |
| Signed in but bounced back to `/login` | Session expired or the profiles row is missing | sign out and in again; check the signup trigger ran |
| "/" shows "Choose your area" | `profiles.role` could not be read | check `profileService.getProfile()` and the profiles SELECT policy |
| `new row violates row-level security policy` | Missing policy, or the row belongs to another user | re-check `database/02_rls.sql` for that table |
| Student sees `permission denied for table options` | Expected: `is_correct` is not readable by students | grade through `submit_attempt`, never by selecting the key |
| A second attempt is refused | `unique(exam_id, student_id)` | by design: one attempt per exam |
| Timer resets on refresh | Remaining time must be computed from `attempts.started_at` | see the TODO list in `TakeExam.jsx` |
| Blank page after login | A page throws while `role` is still loading | check the browser console; every page must render its loading state |

---

## 12. Documentation

- `PLAN.md` - architecture, data model + RLS matrix, grading rules, milestones and the per-member step-by-step checklist.
- Course defence: each member explains their own files only. Start from `App.jsx` (routes) → the page → its service → the database policy.

Academic project - not intended for production use. Known limitations are documented in `PLAN.md` section 9.
