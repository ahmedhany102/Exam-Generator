# AI-Powered Candidate Portal — Implementation Plan

This document is the single source of truth for the course project. It fixes the architecture, the file ownership, the API contract, the database shape, and the order in which work is merged. It contains no full implementation code on purpose: each member writes their own files, and the small snippets here only show the shape of what to write.

## How to use this document

- Every member works **only** inside the files assigned to them in the tree in Section 2, on their own branch (`member1` to `member4`).
- If you need something from another member's file, do not edit that file. Read the contract in this plan or ask in the group chat, then wait for the owner to add it.
- Section 7 is your personal checklist. Work top to bottom; each task ends with a "Done when" line that tells you when to stop and commit.
- Section 8 is the integration order. Do not merge out of that order.
- Nothing in this project uses TypeScript, Redux, Zustand, a UI component library, or a state machine. Plain JavaScript, plain CSS, plain SQL.

---

## 1. Project overview

### 1.1 Academic context

The project is an MVP Candidate Portal built for four university courses at once:

- **Web Development** — HTML5, CSS3, JavaScript (ES6+), React.
- **Artificial Intelligence** — Python, FastAPI, PDF text extraction, TF-IDF cosine similarity, skill matching.
- **Database** — Supabase (PostgreSQL), foreign keys, constraints, Row Level Security, Storage.
- **Basic Security** — authentication, protected routes, input and file validation, RLS isolation, append-only audit logging.

### 1.2 Hard constraints

| Constraint | Why |
| --- | --- |
| Plain JavaScript, no TypeScript | Every type annotation is a question someone must defend. Fewer files, fewer concepts. |
| No Redux or other state library | React `useState` + one `AuthContext` covers the whole app. |
| One CSS file per page or component | CSS fundamentals must be visible and explainable, not hidden by a UI library. |
| Heavy comments in every file | The code is reviewed live; a comment next to a non-obvious line saves the defense. |
| No custom backend | Supabase is the backend. The only server we write is the Python AI service. |
| One Python file for the AI service | A single `main.py` with commented sections is easier to defend than a package tree. |

### 1.3 Architecture

```text
                +-----------------------------------------------------+
                |                 Browser (React + Vite)              |
                |  pages/  components/  services/  utils/  context/    |
                +-----------+----------------------------+------------+
                            |                            |
              HTTPS (supabase-js client)                 | HTTP multipart/form-data
              anon key only, never service_role           | POST http://localhost:8000/analyze
                            |                            |
        +-------------------v-------------------+   +----v--------------------------+
        |            Supabase (BaaS)            |   |   AI microservice (FastAPI)   |
        |                                       |   |                               |
        |  Auth        Postgres        Storage  |   |  main.py                      |
        |  auth.users  profiles         cvs/    |   |   1. validate file            |
        |  JWT         jobs             *.pdf   |   |   2. extract text (PyMuPDF)   |
        |              applications             |   |   3. skill coverage           |
        |              security_logs            |   |   4. TF-IDF cosine            |
        |  RLS on all tables + storage objects  |   |   5. score + strengths/weak   |
        +---------------------------------------+   +-------------------------------+
```

Three rules that follow from this picture, and that the defense will ask about:

1. The browser talks to Supabase directly, so the anon key is public and safety comes from RLS, not from secrecy.
2. The browser talks to the AI service directly, so the AI service never sees the database and never stores the PDF.
3. Scores produced by the AI service are returned to the browser and then inserted by the browser, under the candidate's own RLS INSERT policy.

---

## 2. Folder and file tree

The tree is rooted at the repository root — the folder that contains `.gitignore`, `README.md`, and `PLAN.md`. The `(M1)`-style tags are the owner of each file and are binding.

```text
candidate-portal/                  <- repository root
├── README.md                      (shared: setup + run commands)
├── PLAN.md                        (shared: this document)
├── .gitignore                     (shared: node_modules, .env, __pycache__, .venv, dist)
│
├── database/                      (SQL only, run by hand in the Supabase SQL editor)
│   ├── 01_schema.sql              (M1)
│   ├── 02_rls.sql                 (M1)
│   ├── 03_storage.sql             (M1)
│   └── 04_seed_jobs.sql           (M2)
│
├── frontend/                      (React + Vite single page app)
│   ├── package.json               (M1, on the shared skeleton)
│   ├── vite.config.js             (M1, on the shared skeleton)
│   ├── index.html                 (M1, on the shared skeleton)
│   ├── .env.example               (M1)
│   └── src/
│       ├── main.jsx               (M1)
│       ├── App.jsx                (M1, route table only)
│       ├── index.css              (M1, global reset + CSS variables)
│       ├── lib/
│       │   └── supabaseClient.js                     (M1)
│       ├── context/
│       │   └── AuthContext.jsx                       (M1)
│       ├── components/
│       │   ├── Navbar.jsx                            (M1)
│       │   ├── Navbar.css                            (M1)
│       │   ├── ProtectedRoute.jsx                    (M1)
│       │   ├── Loader.jsx                            (M1)
│       │   ├── Loader.css                            (M1)
│       │   ├── ProgressBar.jsx                       (M3)
│       │   └── ProgressBar.css                       (M3)
│       ├── services/
│       │   ├── securityLogService.js                 (M1)
│       │   ├── profileService.js                     (M1)
│       │   ├── jobsService.js                        (M2)
│       │   ├── aiService.js                          (M3)
│       │   └── applicationsService.js                (M3)
│       ├── utils/
│       │   ├── validateCvFile.js                     (M1)
│       │   ├── filterJobs.js                         (M2)
│       │   └── scoreQuiz.js                          (M2)
│       └── pages/
│           ├── Login.jsx      Login.css               (M1)
│           ├── Register.jsx   Register.css            (M1)
│           ├── Profile.jsx    Profile.css             (M1)
│           ├── SecurityActivity.jsx  SecurityActivity.css  (M1)
│           ├── Jobs.jsx       Jobs.css                (M2)
│           ├── JobDetails.jsx JobDetails.css          (M2)
│           ├── Quiz.jsx       Quiz.css                (M2)
│           ├── Applying.jsx   Applying.css            (M3)
│           └── MyApplications.jsx  MyApplications.css (M3)
│
└── ai-service/                    (standalone Python service, not in the Vite app)
    ├── main.py                    (M4, the whole service)
    ├── requirements.txt           (M4)
    ├── README.md                  (M4, how to run + how the algorithm works)
    ├── samples/
    │   └── README.md              (M4, describes the sample files you add locally)
    └── tests/
        └── test_analyze.py        (M4, pytest + FastAPI TestClient)
```

### 2.1 Responsibility per folder

**`database/`** — four plain SQL files, run once in numbered order in the Supabase SQL editor. They are the only place the schema lives, so a reviewer can read the database from top to bottom. `01_schema.sql` creates tables and constraints, `02_rls.sql` turns on Row Level Security and adds policies, `03_storage.sql` creates the private `cvs` bucket and its folder-prefix policies, `04_seed_jobs.sql` inserts demo jobs with quiz questions. SQL files are idempotent-ish by convention: prefer `create table if not exists` and `drop policy if exists` before `create policy`, so a member can re-run a file while debugging.

**`frontend/`** — a Vite React app with no path aliases and no build tricks. `src/main.jsx` mounts the router, `src/App.jsx` is the route table only, `pages/` holds one file per route with its own CSS, `components/` holds small reusable presentational pieces, `services/` holds every network call so no page calls Supabase or `fetch` directly, `utils/` holds pure functions with no imports (easy to unit test and easy to explain), `lib/` holds the single Supabase client instance, `context/` holds the single global state (the auth session).

**`ai-service/`** — a standalone FastAPI app started with uvicorn. `main.py` is already split into commented sections that stay in place: configuration constants (`MAX_FILE_SIZE_BYTES`, `ALLOWED_MIME_TYPE`, `CORS_ORIGINS`, `MAX_LIST_ITEMS`, `PDF_MAGIC_BYTES`), the app object and its CORS middleware, the flat error handler plus `raise_api_error()`, skill parsing helpers, validation helpers, and the two endpoints. `requirements.txt` lists the five runtime dependencies plus `pytest` and `httpx` for the tests. `tests/test_analyze.py` uses FastAPI's `TestClient`, so no running server and no real PDF are needed.

---

## 3. Routes (fixed)

| Path | Page file | Protected | Purpose |
| --- | --- | --- | --- |
| `/login` | `pages/Login.jsx` | No | Email + password sign in. |
| `/register` | `pages/Register.jsx` | No | Create account, then land on `/profile`. |
| `/` | `pages/Jobs.jsx` | Yes | Job feed with search and skill filter. |
| `/jobs/:jobId` | `pages/JobDetails.jsx` | Yes | Full job post, Apply button. |
| `/jobs/:jobId/quiz` | `pages/Quiz.jsx` | Yes | Timed five-question MCQ quiz. |
| `/jobs/:jobId/apply` | `pages/Applying.jsx` | Yes | AI analysis + application insert. |
| `/applications` | `pages/MyApplications.jsx` | Yes | Submitted applications and scores. |
| `/profile` | `pages/Profile.jsx` | Yes | Name, job title, CV upload. |
| `/security` | `pages/SecurityActivity.jsx` | Yes | The signed-in user's own audit log. |
| `*` | none | — | Unknown URL redirects to `/` with `<Navigate replace />`. |

`App.jsx` already contains this table and must not be restructured. Two behaviours are already wired and should be preserved: `ProtectedRoute` renders `<Loader message="Checking your session..." />` while `useAuth().loading` is true, then redirects to `/login` carrying `state={{ from: location.pathname }}` so the Login page can send the user back where they were; and every protected route in `App.jsx` is wrapped in `<ProtectedRoute>` individually, not by a layout route.

Every protected route is wrapped in `<ProtectedRoute>` inside `App.jsx`. `ProtectedRoute` reads the session from `AuthContext` and renders `<Navigate to="/login" replace />` when there is none.

---

## 4. API contract (frontend to FastAPI)

The base URL is the constant `AI_SERVICE_URL` exported from `src/lib/supabaseClient.js`, which reads `import.meta.env.VITE_AI_SERVICE_URL` and falls back to `http://localhost:8000`. `aiService.js` imports that constant; no page and no other service reads the environment variable directly, so the URL lives in exactly one place.

### 4.1 Endpoints

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| `GET` | `/health` | Liveness check used by the integration test | None |
| `POST` | `/analyze` | Parse a PDF CV, compare it to a job, return a score | None (local only) |
| `GET` | `/docs` | FastAPI's generated Swagger UI, free documentation | None |

### 4.2 `POST /analyze` request

`Content-Type: multipart/form-data` (the browser sets the boundary).

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `cv` | file | Yes | PDF only, maximum 5 MB (5,242,880 bytes), first five bytes must be `%PDF-` |
| `required_skills` | string | Yes | Comma-separated, e.g. `python,sql,git`. Empty string rejects with `MISSING_FIELD`. |
| `description` | string | Yes | Job description text, trimmed, non-empty. |

Example request:

```bash
curl -X POST http://localhost:8000/analyze \
  -F "cv=@samples/strong_cv.pdf;type=application/pdf" \
  -F "required_skills=python,sql,git,docker" \
  -F "description=We are looking for a backend developer with Python and SQL, familiar with Docker."
```

### 4.3 `POST /analyze` success response — `200`

```json
{
  "match_score": 65,
  "strengths": ["Skill match: python", "Skill match: sql", "Skill match: git", "Resume wording closely matches the job description"],
  "weaknesses": ["Missing skill: docker", "Resume text is short; add more detail about projects and results"],
  "matched_skills": ["python", "sql", "git"],
  "missing_skills": ["docker"],
  "extracted_chars": 2314
}
```

Field rules:

- `match_score` — integer, `0` to `100` inclusive.
- `strengths`, `weaknesses` — arrays of strings, each capped at 6 items, never `null`, may be empty.
- `matched_skills`, `missing_skills` — the deduplicated, lower-cased skill lists, in the order the skills appeared in `required_skills`.
- `extracted_chars` — character count of the extracted, normalized CV text.

### 4.4 Error responses

Every error body is `{"detail": "<technical message>", "code": "<CODE>"}`. The frontend switches on `code`, never on `detail`, and shows the strings held in `AI_ERROR_MESSAGES` at the top of `src/services/aiService.js`. Those constants are the single source of truth for wording; the table below quotes them.

| HTTP | `code` | When it occurs | User-facing message (exact string) |
| --- | --- | --- | --- |
| 400 | `INVALID_FILE_TYPE` | Magic bytes are not `%PDF-`, or content type is not `application/pdf`, or extension is not `.pdf` | Your CV must be a real PDF file. Please upload a different file. |
| 413 | `FILE_TOO_LARGE` | File exceeds 5 MB | Your CV is larger than 5 MB. Please upload a smaller PDF. |
| 422 | `EMPTY_OR_UNREADABLE_PDF` | PDF opens but yields no text, or the bytes cannot be parsed | We could not read any text from your CV. Scanned images are not supported yet. |
| 422 | `MISSING_FIELD` | `required_skills` or `description` is empty or whitespace | The job information is incomplete, so the analysis could not run. |
| 500 | `ANALYSIS_FAILED` | Any unexpected exception during extraction or scoring | The AI analysis failed. Please try again in a moment. |

The frontend also handles two conditions that never reach the service, both of which have their own key in `AI_ERROR_MESSAGES`:

| Key | Condition | User-facing message (exact string) |
| --- | --- | --- |
| `SERVICE_OFFLINE` | `fetch` throws: service down, CORS failure, DNS | The AI service is not running. Start it with "uvicorn main:app --port 8000" and try again. |
| `INVALID_FILE_TYPE` / `FILE_TOO_LARGE` | Frontend pre-check rejects the file before upload | The same two strings as the matching rows above. |

When the frontend blocks a file itself, it additionally writes a `security_logs` row with `event_type = 'INVALID_FILE_BLOCKED'` before showing the message. That row is what makes the security demonstration concrete.

### 4.5 Notes the defense will ask about

- **CORS** — `CORSMiddleware` allows exactly the two dev-server origins already listed in `CORS_ORIGINS` (`http://localhost:5173` and `http://127.0.0.1:5173`), which is what `vite.config.js` serves with `strictPort`. No wildcard origin, because a wildcard would let any page on the internet call the service.
- **In-memory only** — the uploaded bytes are read with `await file.read()`, passed to PyMuPDF as a stream, and never written to disk. There is no cleanup step because there is no temp file. This avoids path traversal and disk exhaustion.
- **Magic bytes** — the service does not trust `content_type` or `filename`; both are attacker-controlled. It checks `%PDF-` in the first bytes as the real gate.
- **No auth on the service** — acceptable for a local MVP, listed as future work in Section 9. The service cannot read the database, so the blast radius of this gap is limited to CPU time.
- **Request size** — the 5 MB limit is checked in the service as well as in the frontend, so calling the API directly with `curl` cannot bypass it.

### 4.6 How the frontend builds the `FormData`

The signature is `analyzeCv(cvFile, job)` and `cvFile` is a `File` or a `Blob`. When the user just picked a file in the Profile page, the `File` from the input can be passed straight through; when only a storage path is available, `profileService.downloadCv(cvPath)` returns the `Blob` first. Critically, the request must **not** set the `Content-Type` header: the browser must generate it because it contains the multipart boundary.

```js
// services/aiService.js  (illustration only)
import { AI_SERVICE_URL } from '../lib/supabaseClient.js';

const formData = new FormData();
formData.append('cv', cvFile, 'cv.pdf');            // third argument = the upload filename
formData.append('required_skills', job.required_skills);
formData.append('description', job.description);

// No headers object here. The browser sets multipart/form-data plus its boundary.
const response = await fetch(`${AI_SERVICE_URL}/analyze`, { method: 'POST', body: formData });
```

Passing `'cv.pdf'` as the third argument gives the service a filename even when `cvFile` is a `Blob` with no name. The service ignores that filename and trusts only the bytes.

---

## 5. Scoring algorithm

The algorithm lives entirely in `ai-service/main.py` and is deterministic: the same CV and the same job always produce the same score. That determinism is worth saying out loud during the defense.

### 5.1 Steps

1. **Validate** the upload — size, magic bytes, content type, extension, and non-empty `required_skills` / `description`. Reject early with the codes from Section 4.4.
2. **Extract text** — `fitz.open(stream=raw_bytes, filetype="pdf")`, then join `page.get_text()` for every page. If the joined string is shorter than a small threshold (about 30 characters), return `EMPTY_OR_UNREADABLE_PDF`.
3. **Normalize** — lower-case the text, collapse whitespace, and keep the raw character count in `extracted_chars`.
4. **Parse the skill list** — split `required_skills` on commas, trim each item, lower-case, drop duplicates and empties. The order of first appearance is preserved for the response.
5. **Skill coverage** — for each required skill, test the normalized CV text with a case-insensitive word-boundary regex, built with `re.escape` so that skills containing `.`, `+`, or `#` behave. `skill_coverage = matched / total`.
6. **TF-IDF cosine similarity** — `TfidfVectorizer(stop_words="english")` fitted on the two documents `[cv_text, description]`, then `cosine_similarity` of row 0 against row 1. Cosine is `0.0` when either side has no usable tokens, and that case must not raise.
7. **Combine** — `match_score = round(100 * (0.7 * skill_coverage + 0.3 * cosine))`, clamped to `0..100`. Skills carry 70% because a job posting's explicit requirements are the most defensible signal; free-text similarity carries 30% because it captures seniority and domain wording.
8. **Strengths** — build in this order, then truncate to 6:
   - `"Skill match: <skill>"` for each matched skill, up to 4 items.
   - If `cosine >= 0.35`: `"Resume wording closely matches the job description"`.
   - If the candidate matched at least half the required skills: `"Covers the core technical requirements of this role"`.
   - If the CV text is longer than 2,000 characters: `"Resume is detailed enough for a full review"`.
9. **Weaknesses** — build in this order, then truncate to 6:
   - `"Missing skill: <skill>"` for each missing skill, up to 4 items.
   - If `cosine < 0.20`: `"Resume wording differs noticeably from the job description"`.
   - If `extracted_chars < 1000`: `"Resume text is short; add more detail about projects and results"`.
   - If the candidate matched no required skills: `"None of the required skills were found in the resume"`.

Both lists are plain `list[str]`, which is exactly what the `ai_strengths` and `ai_weaknesses` JSONB columns store.

### 5.2 Worked example

Job: `required_skills = "python,sql,git,docker"`, description about a backend role using Python, SQL, and Docker.

- Required skills after parsing: `["python", "sql", "git", "docker"]` — 4 items.
- The CV mentions Python, SQL, and Git, but not Docker: matched `3`, missing `["docker"]`.
- `skill_coverage = 3 / 4 = 0.75`.
- TF-IDF cosine between the CV text and the description measures `0.41`.
- `match_score = round(100 * (0.7 * 0.75 + 0.3 * 0.41)) = round(100 * (0.525 + 0.123)) = round(64.8) = 65`.
- Strengths: three `Skill match:` lines, plus the wording line because `0.41 >= 0.35`, plus the core-requirements line because `3 / 4 >= 0.5`. That is 5 items, under the cap.
- Weaknesses: `Missing skill: docker`, plus the wording line is *not* added because `0.41` is not below `0.20`. 1 item.

Verifying that arithmetic by hand is a likely defense question, so keep the formula in one commented line and nothing else.

### 5.3 Why this is AI and not a lookup

TF-IDF is a classic information-retrieval model: it weights terms by how often they appear and how rare they are across the two documents, then measures the angle between the two vectors. The course defense should state the limitation honestly — it is lexical, not semantic, so "Postgres" and "PostgreSQL" only match if both appear as written. Section 9 records this.

---

## 6. Database

### 6.1 Setup order

1. Create the Supabase project and copy the **Project URL** and **anon public key** into `frontend/.env` (and the matching names into `frontend/.env.example`, without real values).
2. In Authentication → Providers → Email, turn **email confirmation off** for the demo. Without this, a newly registered user has no session and every protected route bounces to `/login`.
3. Run `database/01_schema.sql` in the SQL editor — tables, foreign keys, constraints, the profile trigger.
4. Run `database/02_rls.sql` — enable RLS on all four tables and create every policy.
5. Run `database/03_storage.sql` — create the private `cvs` bucket and its storage policies.
6. Run `database/04_seed_jobs.sql` — insert the demo jobs with five quiz questions each.

Run them in this order every time a fresh project is created, and never re-run a later file against a schema that was changed by hand. If a table needs a change, edit `01_schema.sql` (or add `05_...sql`) and tell the team, so nobody's local project drifts.

### 6.2 Table reference

**`profiles`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | References `auth.users(id)` `on delete cascade` |
| `full_name` | `text` | Default `''` |
| `job_title` | `text` | Default `''` |
| `cv_url` | `text` | Nullable; stores the storage **path**, e.g. `a1b2.../cv.pdf`, not a URL |
| `updated_at` | `timestamptz` | Default `now()` |

**`jobs`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `title` | `text` | Not null |
| `company_name` | `text` | Not null |
| `location` | `text` | Not null |
| `description` | `text` | Not null |
| `required_skills` | `text` | Not null, comma-separated, e.g. `python,sql,git` |
| `quiz_questions` | `jsonb` | Not null, array of 5 objects: `{question, options: [4 strings], correctIndex}` |
| `created_at` | `timestamptz` | Default `now()` |

**`applications`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_id` | `uuid` | References `profiles(id)` `on delete cascade` |
| `job_id` | `uuid` | References `jobs(id)` `on delete cascade` |
| `quiz_score` | `integer` | Check `between 0 and 5` |
| `ai_match_score` | `integer` | Check `between 0 and 100` |
| `ai_strengths` | `jsonb` | Default `'[]'` |
| `ai_weaknesses` | `jsonb` | Default `'[]'` |
| `status` | `text` | Default `'Submitted'` |
| `created_at` | `timestamptz` | Default `now()` |
| — | constraint | `unique (user_id, job_id)` |

**`security_logs`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `default gen_random_uuid()` |
| `user_email` | `text` | No foreign key — failed logins have no `auth.users` row |
| `event_type` | `text` | `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `CV_UPLOADED`, `INVALID_FILE_BLOCKED`, `APPLICATION_SUBMITTED` |
| `details` | `text` | Short human-readable context, never a password or token |
| `created_at` | `timestamptz` | Default `now()` |

There is deliberately no `updated_at` on `security_logs`: the table is append-only, and RLS enforces that by never granting UPDATE or DELETE.

### 6.3 Schema snippet (`01_schema.sql`, shape only)

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  job_title text not null default '',
  cv_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  quiz_score integer not null check (quiz_score between 0 and 5),
  ai_match_score integer not null check (ai_match_score between 0 and 100),
  ai_strengths jsonb not null default '[]'::jsonb,
  ai_weaknesses jsonb not null default '[]'::jsonb,
  status text not null default 'Submitted',
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);
```

Everything else in the file follows the same shape: table, then constraints, then `alter table ... enable row level security` is **not** here — it belongs in `02_rls.sql` so the two concerns stay readable separately.

### 6.4 Profile trigger snippet

A row must exist in `profiles` the moment a user signs up, otherwise the first `update` from the Profile page silently updates zero rows. Doing it with a trigger avoids a race in which the browser tries to insert the row before the session exists.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

`security definer` is required because the inserting role during signup cannot write to `public.profiles` under RLS. The `set search_path = public` clause is the standard hardening for a `security definer` function.

### 6.5 RLS policy snippet (`02_rls.sql`, shape only)

```sql
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);
```

Every other policy in the file is written the same way: `drop policy if exists`, then `create policy`, with the role named explicitly and the rule in `using` for reads / `with check` for writes.

### 6.6 RLS policy matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | `authenticated`, `auth.uid() = id` | `authenticated`, `auth.uid() = id` | `authenticated`, `auth.uid() = id` (both `using` and `with check`) | none — no policy, so denied |
| `jobs` | `authenticated` only, no row filter | none | none | none |
| `applications` | `authenticated`, `auth.uid() = user_id` | `authenticated`, `auth.uid() = user_id` | none — scores must not be client-editable | none |
| `security_logs` | `authenticated`, `user_email = auth.jwt() ->> 'email'` | `anon` and `authenticated` | none | none |
| `storage.objects` (`cvs` bucket) | `authenticated`, `(storage.foldername(name))[1] = auth.uid()::text` | same folder rule, `bucket_id = 'cvs'` | same folder rule | none |

Notes on the matrix:

- An anonymous visitor cannot read `jobs`. The feed is behind login on purpose, which keeps the demo to one clear rule: unauthenticated means nothing.
- `applications` has no UPDATE policy at all. A candidate cannot rewrite their own `ai_match_score` after submission, even though they inserted the row themselves. This is a real, explainable consequence of RLS.
- Reads of `security_logs` are filtered by the email claim inside the caller's JWT, so a user sees only their own history without any joins.

### 6.7 Why `security_logs` allows INSERT for `anon`

The most interesting log entry in the whole project is `LOGIN_FAILED`. A failed login happens **before** a session exists, so the insert arrives with no JWT and the role `anon`. If `anon` could not insert, the failure would be silent and the security demonstration would be impossible.

That permission is narrowed rather than given away:

```sql
drop policy if exists "security_logs_insert_anon_failure" on public.security_logs;
create policy "security_logs_insert_anon_failure" on public.security_logs
for insert to anon
with check (event_type = 'LOGIN_FAILED' and length(details) <= 500);

drop policy if exists "security_logs_insert_authenticated" on public.security_logs;
create policy "security_logs_insert_authenticated" on public.security_logs
for insert to authenticated
with check (event_type in ('LOGIN_SUCCESS', 'LOGOUT', 'CV_UPLOADED', 'INVALID_FILE_BLOCKED', 'APPLICATION_SUBMITTED'));
```

Consequences to state in the defense: an anonymous caller can create only failure rows, cannot read them back, cannot edit or delete anything, and is limited in payload length. The remaining honest weakness is that an anonymous attacker could spam failure rows; the mitigation for production is a server-side logging function with rate limiting, noted in Section 9.

### 6.8 Storage decision

- Bucket `cvs`, **private** (`public = false`). The specification allowed a public bucket; private was chosen because a CV is personal data and the security course rewards that choice. The frontend reads the file with `storage.download()` and, where a link is needed, `storage.createSignedUrl(path, 60)`.
- Object path is always `{user_id}/cv.pdf`. One CV per user; a re-upload uses `upsert: true` so it replaces the previous file instead of accumulating duplicates.
- Bucket limits: `file_size_limit = 5242880`, `allowed_mime_types = ARRAY['application/pdf']`. These are enforced by Supabase itself, so even a direct API call with the anon key cannot store a `.exe`.
- Storage policies use `storage.foldername(name)`, which splits the object path on `/`. Element `[1]` is the first folder, so `auth.uid()::text` must equal it. This is what makes "User B cannot read User A's CV" true at the storage layer, not just in the UI.

### 6.9 Two-user RLS verification test

Run this by hand after `02_rls.sql` and `03_storage.sql`, and record the result in the pull request description. This is the single most valuable piece of evidence for the security part of the grade.

1. Create user A (`a@test.local`) and user B (`b@test.local`) through the Register page, with different passwords.
2. Signed in as A: fill in the profile, upload a CV, apply to one job. Note the application id.
3. Signed in as B: open `/applications` and `/security` — both must be empty of A's data. Open `/profile` — the CV field must be empty.
4. Signed in as B, in the browser console run each of these and confirm the returned `data` array is empty (`[]`) while `error` is `null`, because RLS filtered the rows rather than raising:
   ```js
   // Paste into the console on the running app while signed in as B.
   await supabase.from('profiles').select('*')
   await supabase.from('applications').select('*')
   await supabase.from('security_logs').select('*')
   await supabase.storage.from('cvs').list('')       // must not contain A's folder
   ```
5. Signed in as B, attempt a forged insert — confirm the insert fails with a policy violation, not a success:
   ```js
   // Replace with A's real user id. Must fail.
   await supabase.from('applications').insert({ user_id: '<A_USER_ID>', job_id: '<JOB_ID>', quiz_score: 5, ai_match_score: 100 })
   ```
6. Signed in as B, attempt to update A's profile — must affect zero rows:
   ```js
   await supabase.from('profiles').update({ full_name: 'hacked' }).eq('id', '<A_USER_ID>')
   ```
7. Signed out, attempt to read jobs and to insert a non-failure log — the first must return `[]`, the second must fail the `with check`:
   ```js
   await supabase.from('jobs').select('*')
   await supabase.from('security_logs').insert({ user_email: 'x@y.z', event_type: 'LOGIN_SUCCESS', details: 'forged' })
   ```
8. Sign in as B with a wrong password, then sign in as A and open `/security` — a `LOGIN_FAILED` row for `b@test.local` must be visible only to B, not to A.

If any step behaves differently, the policy in `02_rls.sql` is wrong; fix the policy, not the test.

---

## 7. Milestones

### 7.1 M0 — Kickoff (already in the repository)

Milestone names used across the project, matching the `TODO(Member ... Milestone Mx)` headers already in the files:

- **M0** — this scaffold commit.
- **M1** — Ahmed Hany: schema, RLS, storage, auth, profile, security log.
- **M2** — Ibrahim Lotfy: job seeds, job feed, job details, quiz.
- **M3** — Ahmed Fayez: AI service call, submission pipeline, applications dashboard.
- **M4** — Ibrahim Abduljawad: the Python service and its tests.
- **M5** — integration, end-to-end test, defense rehearsal (Section 8).

Already complete in M0 — read it, do not rewrite it:

- `README.md`, `PLAN.md`, `.gitignore`.
- `src/lib/supabaseClient.js`: the single client, plus the `isSupabaseConfigured` flag and the `AI_SERVICE_URL` constant.
- `src/main.jsx` (`BrowserRouter` → `AuthProvider` → `App`) and `src/App.jsx` (the route table plus the unknown-URL redirect).
- `src/components/ProtectedRoute.jsx`, `src/components/Loader.jsx`, `Loader.css`, `src/components/Navbar.jsx`, `Navbar.css`, `src/components/ProgressBar.jsx`, `ProgressBar.css`, `src/index.css`.
- `frontend/vite.config.js` (port 5173 with `strictPort`, matching the CORS origin), `frontend/.env.example`, `frontend/package.json` (React 18, React Router 6, supabase-js 2; no test runner, no UI library), `frontend/index.html`.
- `src/context/AuthContext.jsx` is partly done: it loads the session, subscribes to `onAuthStateChange`, and exposes `loading` and `signOut`. Member 1 adds `signIn` and `signUp`.
- Every function in the five `services/` files already exists with its final name, signature, and JSDoc; the bodies throw `"... is not implemented yet"`. Implement the bodies, do not rename them.
- `ai-service/main.py` and `ai-service/tests/test_analyze.py` are real, working code: a contract-shaped stub that validates input, returns derived fake numbers, and already passes six tests. Member 4 replaces the fake parts (Section 7, Member 4).
- Still placeholders with a `TODO(Member ...)` header: the four `database/*.sql` files, every `pages/*.jsx`, and the three `utils/`.
- Branches `member1` to `member4`, all cut from the same `main` commit.

Function names fixed by the scaffold (use these exactly):

| File | Functions |
| --- | --- |
| `services/securityLogService.js` | `logSecurityEvent({ eventType, details, email })`, `getMySecurityLogs()` |
| `services/profileService.js` | `getProfile()`, `updateProfile(updates)`, `uploadCv(file)`, `downloadCv(cvPath)` |
| `services/jobsService.js` | `getJobs()`, `getJobById(jobId)` |
| `services/aiService.js` | `analyzeCv(cvFile, job)`, constant `AI_ERROR_MESSAGES` |
| `services/applicationsService.js` | `submitApplication({ jobId, quizScore, aiMatchScore, aiStrengths, aiWeaknesses })`, `getMyApplications()`, `hasApplied(jobId)` |

Each service reads the user id itself from `supabase.auth.getUser()`, so no page passes a user id in. That keeps the RLS story simple: the client can only ever act as the logged-in user.

Rules for all four members: one branch each, no direct commits to `main`, pull requests only after your own checklist is done and `npm run dev` starts cleanly.

### Ahmed Hany — Member 1 (branch member1)

1. [ ] Create the Supabase project. Copy the URL and anon key into `frontend/.env`, restart the dev server, and confirm the configuration warning banner in `App.jsx` disappears.
   - Done when: `/login` renders and the banner is gone.
2. [ ] Write `database/01_schema.sql`: the four tables from Section 6.2 in dependency order (`profiles`, `jobs`, `applications`, `security_logs`), with all checks, the `unique (user_id, job_id)` constraint, and the `handle_new_user` trigger from Section 6.4. Run it in the SQL editor.
   - Done when: Table Editor shows four tables and the trigger appears under Database → Triggers.
3. [ ] Write `database/02_rls.sql` using the matrix in Section 6.6, including the narrowed `anon` insert policy from Section 6.7. Run it and confirm the Table Editor shows RLS enabled with a warning badge on every table.
   - Done when: each of the four tables lists its policies and none says "RLS disabled".
4. [ ] Write `database/03_storage.sql`: create the private `cvs` bucket with `file_size_limit` and `allowed_mime_types`, then the three folder-prefix policies. Run it.
   - Done when: Storage shows `cvs` marked private with 5 MB in the size column.
5. [ ] Extend `src/context/AuthContext.jsx` with `signIn(email, password)` (wrapping `supabase.auth.signInWithPassword`) and `signUp(email, password, fullName)` (wrapping `supabase.auth.signUp` with `options: { data: { full_name: fullName } }` so the trigger in Section 6.4 can fill the profile). Expose both on the context value next to `signOut`.
   - Done when: after a refresh on `/profile` the user stays signed in, and a new signup produces a `profiles` row with the name already filled in.
6. [ ] Implement `logSecurityEvent({ eventType, details, email })` in `src/services/securityLogService.js`, keeping the signature already in the file: fall back to `supabase.auth.getUser()` when `email` is empty, insert one row, and never throw to the caller (a failed log must not break the login flow). Comment why the failure is swallowed rather than propagated.
   - Done when: calling it from the console creates exactly one visible row for that email.
7. [ ] Optional polish in `src/components/Navbar.jsx`, which is already complete: replace the raw email with the user's `full_name` from `profiles` (through `profileService.getProfile()`), falling back to the email when the name is empty.
   - Done when: the header shows the saved name after the Profile page is updated, and still shows the email before any name is set.
8. [ ] Build `pages/Login.jsx` and `Login.css`: call `signIn` from the context, call `logSecurityEvent` with `LOGIN_SUCCESS` or `LOGIN_FAILED` on every attempt, show one generic message on any failure ("Email or password is incorrect.") so the form never reveals which accounts exist, and after success navigate to `location.state?.from ?? '/'`.
   - Done when: a correct password lands on the page the user originally asked for, and a wrong password shows the generic message plus one `LOGIN_FAILED` row.
9. [ ] Build `pages/Register.jsx` and `Register.css`: call `signUp` with email, password, and full name, show a clear message when Supabase returns an error, and navigate to `/profile` on success.
   - Done when: registering creates an auth user and a matching `profiles` row whose `full_name` is already set.
10. [ ] Implement `src/utils/validateCvFile.js` as a pure function returning `{ valid, error }` (the shape documented in the shipped JSDoc), checking extension, MIME type, and a `size < 5 * 1024 * 1024` limit. Then implement the bodies of `getProfile()`, `updateProfile(updates)`, `uploadCv(file)`, and `downloadCv(cvPath)` in `src/services/profileService.js`, keeping their existing signatures (path `{userId}/cv.pdf`, `upsert: true`, then an `update` writing that path into `cv_url`).
    - Done when: all four functions work from the console while signed in.
11. [ ] Build `pages/Profile.jsx` and `Profile.css` on top of `profileService`: show the email read-only, editable name and job title, a file input, and a "current CV" line. Route every file through `validateCvFile` first: on failure show its message and call `logSecurityEvent({ eventType: 'INVALID_FILE_BLOCKED', ... })`; on success upload and log `CV_UPLOADED`.
    - Done when: the name and job title survive a refresh, the object exists at `{USER_ID}/cv.pdf`, `cv_url` equals that path, and picking a `.png` shows the file-type message, logs `INVALID_FILE_BLOCKED`, and uploads nothing.
12. [ ] Build `pages/SecurityActivity.jsx` and its CSS on top of `getMySecurityLogs()`: a plain table with event type, details, and timestamp, newest first, and a friendly empty state. Then run the Section 6.9 verification script and paste the results into your pull request.
    - Done when: the page lists only the signed-in user's events and the two-user test passes every step.

**Defense notes**

- Why the anon key is public and safe, and why the service_role key must never reach the browser.
- How `onAuthStateChange` plus a `loading` flag prevents the redirect flicker, and what happens if you drop the flag.
- Why a `security definer` trigger is needed for profile creation, and why the CV bucket is private rather than public.
- Why failed logins need an `anon` INSERT policy, and what the `with check` clause narrows.

### Ibrahim Lotfy — Member 2 (branch member2)

1. [ ] Write `database/04_seed_jobs.sql`: eight jobs, each with a realistic `description`, a comma-separated `required_skills`, and a `quiz_questions` JSONB array of exactly five objects shaped `{question, options, correctIndex}` with four options each. Run it and ask Member 1 to review it.
   - Done when: `select count(*) from jobs` returns 8, and for every row `jsonb_array_length(quiz_questions) = 5` with `correctIndex` between 0 and 3.
2. [ ] Implement `src/services/jobsService.js`: `getJobs()` returning all jobs newest first, and `getJobById(id)` returning a single row with `.single()`. Both return `{ data, error }` shaped results or throw a clean message — pick one convention and comment it.
   - Done when: `getJobs()` from the console returns 8 rows while signed in and an empty array while signed out.
3. [ ] Implement `src/utils/filterJobs.js` as a pure function `filterJobs(jobs, query)` with no imports: case-insensitive match against `title`, `company_name`, `location`, and `required_skills`. Split `required_skills` on commas for the skill part.
   - Done when: an empty query returns all jobs, `"python"` returns only jobs listing python, and `"reac"` matches React jobs.
4. [ ] Build `pages/Jobs.jsx` and `Jobs.css`: a controlled search input, a skill chip row that sets the query, a card grid, a result count, and an empty state ("No jobs match your search."). Use `useState` + `useEffect` and the pure filter from task 3, not a new library.
   - Done when: typing filters the grid immediately with no refetch, and clearing the input restores all eight cards.
5. [ ] Build `pages/JobDetails.jsx` and `JobDetails.css`: load by `useParams().jobId`, show company, location, description, and the required skills as chips. Guard against a missing job with a "Job not found" state. The Apply button navigates to `/jobs/:jobId/quiz`, and is disabled with "You have already applied" when `hasApplied(jobId)` from `src/services/applicationsService.js` returns true.
   - Done when: a bad id in the URL shows the not-found state instead of a blank page, and the Apply button is disabled for a job already applied to.
   - Cross-owner note: `hasApplied()` belongs to Member 3 and throws until M3 lands, so wrap the call in `try/catch` and treat a throw as `false` for now.
6. [ ] Implement `src/utils/scoreQuiz.js` as a pure function `scoreQuiz(questions, answers)` comparing `answers[i]` to `questions[i].correctIndex` and returning an integer `0..5`. Comment the assumption that both arrays are the same length.
   - Done when: an all-correct answer array returns 5, an all-wrong one returns 0, and an unanswered entry counts as wrong rather than throwing.
7. [ ] Build the quiz state in `pages/Quiz.jsx`: shuffle nothing, keep a `currentIndex` and an `answers` array of length 5 initialized to `-1`, with Next and Previous navigation and a progress line ("Question 3 of 5"). Disable Next until an option is selected.
   - Done when: you can move forward and back and previously selected answers stay selected.
8. [ ] Add the timer: a `useState` seconds counter of 300, a `setInterval` inside a `useEffect` with a cleanup function that clears it, and an auto-submit path when it reaches zero. Comment the cleanup, because a missing `clearInterval` is a classic defense question and a real leak.
   - Done when: the countdown reaches 0 and the quiz auto-submits once, and navigating away leaves no interval running in the console.
9. [ ] On completion, call `scoreQuiz` and navigate to `/jobs/:jobId/apply` with the score passed in router state as `{ quizScore }`. Handle a direct visit to `/apply` with no state by redirecting back to the quiz.
   - Done when: finishing the quiz shows the applying screen with the correct quiz score in its URL-independent state, and pasting `/jobs/<id>/apply` directly redirects to the quiz.
10. [ ] Write `Quiz.css`: one question card, four full-width option buttons with a clear selected state, a timer that turns red under 60 seconds, and a layout that works at 375 px wide.
    - Done when: the quiz is usable on a narrow window with no horizontal scrolling and the timer colour change is visible.

**Defense notes**

- Why `filterJobs` and `scoreQuiz` are pure functions in `utils/` with no imports, and how that makes them testable.
- Why the timer must live in a `useEffect` with a cleanup function, and what `setInterval` leaks without it.
- Why searching is done in the browser instead of with a Supabase query at this scale, and when that would stop being acceptable.
- How `useParams` and router state carry the job id and quiz score between pages, and why the score is not passed in the URL.

### Ahmed Fayez — Member 3 (branch member3)

1. [ ] Implement the body of `analyzeCv(cvFile, job)` in `src/services/aiService.js`, keeping the shipped signature and JSDoc: build the `FormData` exactly as in Section 4.6, `fetch` `${AI_SERVICE_URL}/analyze`, parse the JSON, and round `match_score` to an integer.
   - Done when: calling it from the console with a real job returns `match_score`, `strengths`, and `weaknesses`.
2. [ ] Finish the error handling in `aiService`: on a non-`ok` response, read the body and throw an `Error` whose message is `AI_ERROR_MESSAGES[body.code]` with `body.code` attached to the error object, so `Applying.jsx` can branch on it. Wrap the `fetch` so a network `TypeError` becomes the `SERVICE_OFFLINE` message.
   - Done when: stopping the Python service and calling it shows the `SERVICE_OFFLINE` string, not an unhandled rejection.
3. [ ] Implement the three bodies in `src/services/applicationsService.js`, keeping the shipped signatures: `submitApplication({ jobId, quizScore, aiMatchScore, aiStrengths, aiWeaknesses })`, `getMyApplications()` with the embedded `jobs (title, company_name)` relation ordered newest first, and `hasApplied(jobId)` using `select('id').eq('job_id', ...).eq('user_id', ...).maybeSingle()`. Take the user id from `supabase.auth.getUser()`, never from a page.
   - Done when: each function works from the console while signed in and returns only the current user's rows.
4. [ ] Detect the duplicate case: when `submitApplication` fails with Postgres error code `23505` (unique violation), return a specific `ALREADY_APPLIED` result instead of a generic error, and comment why the check is done in the database and not only in the UI.
   - Done when: applying twice to the same job shows "You have already applied for this job." and leaves exactly one row.
5. [ ] Build `pages/Applying.jsx` and `Applying.css` as the submission pipeline with three visible states: uploading and analyzing, saving, done. On mount, read `quizScore` from router state, call `analyzeCv`, then `submitApplication`, then log `APPLICATION_SUBMITTED` through Member 1's `logSecurityEvent`, then navigate to `/applications`.
   - Done when: the whole flow completes in one pass and the record is visible on `/applications`.
6. [ ] Add retry and failure UI to `Applying.jsx`: on failure show the message from step 2 and a "Try again" button that re-runs the pipeline, plus a "Back to job" link. Never leave the user on a blank screen and never insert a half-filled application row.
   - Done when: with the Python service stopped, the page shows the offline message and Try again succeeds after the service is started.
7. [ ] Use the shipped `src/components/ProgressBar.jsx` unchanged. It already accepts `label`, `value`, `max`, `suffix`, and `variant` (`success` | `warning` | `danger` | `primary`); write one small `scoreVariant(percent)` helper at the top of `MyApplications.jsx` returning `success` at 70 percent or more, `warning` at 40 or more, and `danger` otherwise.
   - Done when: the dashboard bars show the right colour band for scores of 20, 55, and 85, and `ProgressBar.jsx` is untouched in your diff.
8. [ ] Build `pages/MyApplications.jsx` and `MyApplications.css` on top of `getMyApplications()`: one card per application with job title, company, status, submission date, a quiz bar (`max={5}`, `suffix="/ 5"`), an AI match bar (`max={100}`), and the strengths and weaknesses arrays as bullet lists. Add a loading `Loader` and an empty state linking to `/`.
   - Done when: a submitted application shows both bars at the right widths and all strengths and weaknesses are listed.
9. [ ] Harden the page against missing data: treat `null` or missing JSONB arrays as empty lists, and handle a deleted job (`jobs` relation comes back as `null`) without crashing the map.
   - Done when: setting `ai_strengths` to `[]` in the Table Editor renders "No strengths recorded" instead of an error.
10. [ ] Run the full pipeline against Member 4's real analyser once the stub is replaced, and paste the JSON response you received into your pull request as evidence.
    - Done when: the pasted response matches the contract in Section 4.3 field for field.

**Defense notes**

- Why `FormData` must not have a manual `Content-Type` header, and what the multipart boundary is.
- Why every user-facing message comes from the `AI_ERROR_MESSAGES` constants instead of being typed inline in a page.
- Why the duplicate application is prevented by a database constraint rather than an `if` in JavaScript.
- How error `code` values are mapped to messages, and why branching on `detail` would be wrong.

### Ibrahim Abduljawad — Member 4 (branch member4)

1. [ ] Create the virtual environment and install the pinned dependencies: `python -m venv .venv`, activate it, `pip install -r requirements.txt`. Then start `python main.py` and open `/docs`.
   - Done when: `/health` returns `{"status":"ok"}` and `/docs` lists both endpoints.
2. [ ] Read the M0 stub in `main.py` and run `pytest -q` before changing anything. The six existing tests already pin the contract the frontend codes against, so they are your baseline.
   - Done when: six tests pass, and you can explain what `raise_api_error()` and the `http_exception_handler` do to produce the flat `{detail, code}` body.
3. [ ] Add `extract_text(raw_bytes)` using PyMuPDF: `fitz.open(stream=raw_bytes, filetype="pdf")`, join `page.get_text()` for all pages, close the document in every path, and raise 422 `EMPTY_OR_UNREADABLE_PDF` when the text is shorter than about 30 characters or parsing fails. Keep the comment that the bytes are never written to disk.
   - Done when: a real PDF returns its text, a truncated or image-only PDF returns 422 instead of a traceback, and `extracted_chars` now reports characters of text.
4. [ ] Harden `read_and_validate_cv()` with the real MIME check from `cv.content_type` against `ALLOWED_MIME_TYPE` and the declared-size check before reading, keeping the `%PDF-` check as the decisive test and keeping the "cheapest check first" comment.
   - Done when: a file ending in `.pdf` whose multipart type is `image/png` returns 400 `INVALID_FILE_TYPE`.
5. [ ] Keep `parse_skills()` as shipped (it already trims, lower-cases, and de-duplicates) and replace `split_matched_skills()` with `compute_skill_coverage(cv_text, skills)`: `re.search` with `re.escape(skill)`, `\b` boundaries, and `re.IGNORECASE`, returning the matched list, the missing list, and coverage as `0..1`.
   - Done when: a CV containing "Python3" matches `python`, an absent skill is reported missing, and coverage equals `matched / total`.
6. [ ] Add `compute_similarity(cv_text, description)` using `TfidfVectorizer(stop_words="english")` fitted on both documents and `cosine_similarity`, returning `0.0` when either side has no usable tokens instead of raising.
   - Done when: identical text scores near `1.0`, unrelated short text scores near `0.0`, and an empty description returns `0.0` with no exception.
7. [ ] Replace `build_mock_result()` and `analyze_cv_stub()` with `build_analysis_result(...)` and `analyze_cv(cv_text, required_skills, description)`: `match_score = round(100 * (0.7 * coverage + 0.3 * cosine))` clamped to `0..100`, plus the strengths and weaknesses rules from Section 5.1 capped by `MAX_LIST_ITEMS`.
   - Done when: the worked example in Section 5.2 reproduces score 65 and neither list ever exceeds six items.
8. [ ] Keep the endpoint thin: `analyze()` becomes `validate_text_fields` → `read_and_validate_cv` → `extract_text` → `analyze_cv` → return the dictionary. Add no new endpoints, and keep `raise_api_error()` as the only way errors are raised.
   - Done when: `/analyze` returns the real analysis and every failure still uses one of the five agreed codes.
9. [ ] Update `tests/test_analyze.py`: fix the `extracted_chars` assertion (it compared the file size, which is now the text length) and add cases for the real scorer — a skill-rich CV scoring higher than a skill-poor one, an unreadable PDF returning 422 `EMPTY_OR_UNREADABLE_PDF`, and the MIME-mismatch rejection.
   - Done when: `pytest -q` passes at least nine tests from a clean checkout with no server running.
10. [ ] Add two text-based sample PDFs under `samples/` (one containing the required skills, one missing them), describe them in `samples/README.md`, and check both with the `curl` command from Section 4.2.
    - Done when: the strong sample scores 70 or more and the weak sample scores below 40.
11. [ ] Rewrite the parts of `ai-service/README.md` that describe the stub so they describe the real pipeline (extract → normalize → skills → TF-IDF → score → feedback), the error codes, and the run and test commands.
    - Done when: someone who has never seen the code can start the service and interpret the JSON response from the README alone.

**Defense notes**

- Why magic-byte checking is stronger than trusting `Content-Type` or the file extension.
- How TF-IDF weighting works in one sentence, and what cosine similarity measures.
- Why the score weights skills at 70% and description similarity at 30%, and what would change if you inverted it.
- Why the service processes files in memory, and why the CORS list is an exact origin rather than `*`.

---

## 8. Integration and final milestones

### 8.1 Merge and pull request order

Merge in this order; each step unblocks the next.

| Order | Branch | Depends on | Note |
| --- | --- | --- | --- |
| 1 | `member4` | nothing | The M0 stub of `/analyze` already returns the contract shape, so this branch can merge before the real algorithm exists and it unblocks Member 3 immediately. |
| 2 | `member1` | nothing | `database/01`–`03` plus auth, profile, and security pages. Everything else assumes a signed-in user and a working profile. |
| 3 | `member2` | `member1` (RLS, `AuthContext`) | `database/04_seed_jobs.sql` and the jobs and quiz pages. Its Apply button also calls Member 3's `hasApplied()`, so it must tolerate that function throwing until M3 merges. |
| 4 | `member3` | `member1` (profile, CV path) and `member2` (jobs) | AI service call, submission, dashboard. |
| 5 | `member4` again | everything | The real analyser replaces the stub once Member 3 has proven the pipeline against it. |

Practical rules: keep `main` green (the app must start at every merge), rebase your branch on `main` before opening the pull request, and never resolve a conflict by deleting someone else's file — ask its owner. The only file two members may both need to touch is `frontend/src/App.jsx`; it is already complete, so in practice nobody should need to edit it.

### 8.2 End-to-end test script

Run against `main` after all four merges, with two accounts and both servers running.

1. Start the frontend (`npm run dev`) and the AI service (`uvicorn main:app --reload`).
2. Register user A. Confirm a `profiles` row exists and `/security` shows a `LOGIN_SUCCESS`.
3. Sign out, then sign in with a wrong password. Confirm the generic error and, after a correct sign-in, that `/security` shows the `LOGIN_FAILED` row.
4. As A, complete the profile and upload a valid PDF. Confirm the Storage object at `{A_ID}/cv.pdf` and that `/security` shows `CV_UPLOADED`.
5. Open the job feed, filter by a skill, open a job, take the quiz, and let the timer run down on a second attempt to confirm auto-submit.
6. Finish the quiz and watch the applying screen. Confirm one row in `applications` with the right `quiz_score`, `ai_match_score`, and both JSONB arrays.
7. Open `/applications` and confirm both bars and both lists render.
8. Try applying to the same job again. Confirm the "already applied" message and still exactly one row.
9. Register user B and confirm an empty `/applications`, an empty `/security`, and an empty profile CV field.
10. Repeat the console checks in Section 6.9 with B still signed in.
11. Stop the AI service, apply as B, and confirm the offline message plus a working "Try again" after restarting it.

### 8.3 Security checks

- Rename `malware.exe` to `cv.pdf` and upload it: the frontend must block on MIME/extension, and a direct `curl` to `/analyze` must return 400 `INVALID_FILE_TYPE`.
- Upload a 6 MB PDF: blocked in the frontend by `validateCvFile`, rejected by the bucket limit, and rejected by the service with 413.
- Sign in as two users in two browser profiles and confirm neither can see the other's profile, applications, logs, or CV.
- Confirm no `.env` file, anon key dump, password, or token appears in any committed file or in `security_logs.details`.
- Confirm the browser bundle contains only the anon key by searching `dist/` for `service_role`.

### 8.4 Polish and documentation

- Consistent visual pass: one accent colour in `index.css`, the same card radius and spacing across pages, empty states everywhere a list can be empty.
- Responsive check at 375 px and 1280 px wide for the feed, job details, quiz, and dashboard.
- `README.md` gains the final run instructions, the four-member ownership table, a screenshot list, and a link to this plan.
- `ai-service/README.md` gains the algorithm explanation and the test command.

### 8.5 Rehearsal

- Each member demonstrates their own files for 3 minutes, from the actual code, not from slides.
- Everyone can answer the four defense notes bullets under their own checklist without notes.
- One person (Member 1) explains the architecture diagram in Section 1.3 end to end, including what happens to the anon key.
- Dry-run the two-user RLS test live, since it is the hardest thing to fake and the most impressive thing to show.

---

## 9. Known limitations and assumptions

| Limitation | Impact | Mitigation or future work |
| --- | --- | --- |
| Scanned or image-only PDFs yield no text | That CV scores 0 and shows `EMPTY_OR_UNREADABLE_PDF` | The message tells the user to upload a text-based PDF. Future work: OCR with Tesseract. |
| `quiz_score` is computed in the browser | A user can forge a perfect score with the console | Accepted for the MVP. Future work: recompute on a trusted server, or store answers and score them in the database with a trigger. The Defense notes should name this before the examiner does. |
| The AI service has no authentication and runs on localhost | Anyone who can reach port 8000 can call `/analyze` | Local-only by design for the demo; the service holds no data and can read no database. Future work: an API key header checked by a FastAPI dependency. |
| The quiz timer resets on page refresh | A user can restart the clock | Documented and accepted. Future work: persist a start timestamp in `sessionStorage` or in an `applications` draft row. |
| Email confirmation is disabled for the demo | Real sign-ups would be unverified | Required so the demo does not stall on an inbox. The README states that production must re-enable it. |
| TF-IDF is lexical, not semantic | "Postgres" and "PostgreSQL" do not match each other | Partly mitigated by listing skills in `required_skills` in their common spelling. Future work: sentence embeddings. |
| Scores are inserted by the browser, not the AI service | A user could insert a fabricated `ai_match_score` | Partly mitigated because there is no UPDATE policy, so the fabricated row is the only row they get, and the duplicate constraint prevents resubmission. Future work: move the insert into a server-side function. |
| Eight seeded jobs, no pagination | Fine at demo scale | Future work: `range()` paging and a full-text index. |

Assumption behind all of the above: the project is assessed as a course MVP, so a documented limitation with a named fix scores better than an undocumented one.

---

## 10. Run commands appendix

### 10.1 Frontend

```bash
cd frontend
npm install
cp .env.example .env        # then fill in the Supabase URL and anon key (Windows: copy .env.example .env)
npm run dev                 # http://localhost:5173
npm run build               # production build into dist/
npm run preview             # serve the built app locally
```

`frontend/.env.example` already ships these three names with placeholder values; only the first two need replacing with real project values:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_AI_SERVICE_URL=http://localhost:8000
```

### 10.2 AI service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Windows; on macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000    # http://localhost:8000/docs
pytest -q
```

### 10.3 Supabase SQL run order

In the Supabase SQL editor, in this order, on a fresh project:

```text
database/01_schema.sql
database/02_rls.sql
database/03_storage.sql
database/04_seed_jobs.sql
```

Then, once, in Authentication → Providers → Email: turn off "Confirm email" for the demo.

### 10.4 Two-terminal demo layout

Terminal 1: `uvicorn main:app --reload --port 8000` from `ai-service/`.
Terminal 2: `npm run dev` from `frontend/`.
Browser: `http://localhost:5173`. Supabase dashboard open in a second tab for the Table Editor and Storage proof.
