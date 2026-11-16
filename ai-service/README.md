# Candidate Portal — AI Service (`ai-service`)

A small **FastAPI** microservice that compares a candidate's CV (PDF) with a
job description and returns a match score plus readable strengths and
weaknesses.

- **Owner:** Member 4 — *Ibrahim Abduljawad*
- **Consumer:** Member 3 (frontend AI integration, `src/services/aiService.js`)
- **Status:** **M0 — stub.** The HTTP contract is final and testable; the
  analysis itself is fake (see [M0 stub](#m0-stub-what-is-real-and-what-is-not)).

---

## 1. Where this service sits in the architecture

```
        +---------------------------+   POST /analyze (multipart/form-data)   +------------------+
        |  Frontend (React + Vite)  | --------------------------------------> |  AI service      |
        |  Member 3                 | <-------------------------------------- |  FastAPI         |
        |  http://localhost:5173    |       200 JSON analysis result          |  Member 4        |
        +---------------------------+                                         |  localhost:8000  |
                    |                                                         +------------------+
                    | supabase-js (anon key + JWT)
                    v
        +---------------------------+
        |  Supabase                 |
        |  Auth / Postgres / Storage|
        |  Member 1 (+ seed: M2)    |
        +---------------------------+
```

- The **frontend** uploads the PDF and the job's `required_skills` +
  `description` directly to this service with `fetch` / `FormData`.
- There is **no custom backend**: the browser talks to Supabase with the anon
  key (RLS protects the rows) and to this service for the analysis. This
  service never touches the database and stores nothing.
- The service is stateless: it **never writes uploaded files to disk** and keeps
  no database of its own.
- Cross-origin requests are allowed from `http://localhost:5173` and
  `http://127.0.0.1:5173` (configured in `main.py` → `CORS_ORIGINS`).

---

## 2. Prerequisites

- **Python 3.10 or newer** (`python --version`)
- pip (comes with Python on Windows)
- No database, no Node.js, no API keys

---

## 3. Setup and run

### Windows (PowerShell)

```powershell
# From the repository root
cd ai-service

# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# If PowerShell blocks the script, allow it for the current user once:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 2. Install the dependencies
pip install -r requirements.txt

# 3. Start the development server (auto-reloads when main.py changes)
uvicorn main:app --reload --port 8000
```

Alternative: `python main.py` does the same thing (it calls `uvicorn.run(...)`
with `reload=True` at the bottom of `main.py`).

### macOS / Linux

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Check that it is alive

| What | Where | Expected |
| --- | --- | --- |
| Health check | <http://127.0.0.1:8000/health> | `{"status":"ok"}` |
| Interactive API docs (Swagger UI) | <http://127.0.0.1:8000/docs> | A page listing `GET /health` and `POST /analyze` |

The Swagger page is the easiest way to try an upload by hand: open `/docs`,
expand `POST /analyze`, click **Try it out**, pick a PDF, fill in
`required_skills` and `description`, then **Execute**.

---

## 4. Run the tests

```powershell
cd ai-service
pytest tests/test_analyze.py -v
```

The tests use `fastapi.testclient.TestClient` (backed by `httpx`), so **no
running server is needed** — FastAPI is called in-process. They cover the happy
path plus every error code below.

---

## 5. API contract

### `GET /health`

Response `200`:

```json
{ "status": "ok" }
```

### `POST /analyze`

Content type: **`multipart/form-data`**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `cv` | file (PDF) | yes | The candidate's CV. Max **5 MB**, must start with the `%PDF-` signature. |
| `required_skills` | text | yes | Comma-separated skills of the job, e.g. `python, sql, git`. Split on commas, trimmed, lowercased, duplicates removed. |
| `description` | text | yes | The job description text. |

Success response `200`:

| Key | Type | Meaning |
| --- | --- | --- |
| `match_score` | int (0–100) | How well the CV matches the job. |
| `strengths` | list[str] | Short positive points (max 6 items). |
| `weaknesses` | list[str] | Short gaps (max 6 items). |
| `matched_skills` | list[str] | Requested skills found in the CV. |
| `missing_skills` | list[str] | Requested skills not found in the CV. |
| `extracted_chars` | int | Characters of text extracted from the PDF. |

Example:

```json
{
  "match_score": 66,
  "strengths": [
    "Skill match: python",
    "Skill match: sql",
    "Relevant wording found for this job description"
  ],
  "weaknesses": ["Missing skill: git"],
  "matched_skills": ["python", "sql"],
  "missing_skills": ["git"],
  "extracted_chars": 55
}
```

> `matched_skills` and `missing_skills` always contain every requested skill
> exactly once between them. `extracted_chars` simply mirrors the byte size of
> the PDF you upload at M0, so it changes with your own file (the value above
> belongs to the example file).

### Error codes

All errors use the **same flat body shape**:

```json
{ "detail": "<human-readable message>", "code": "<MACHINE_CODE>" }
```

| Status | `code` | When it happens | Frontend handling |
| --- | --- | --- | --- |
| 400 | `INVALID_FILE_TYPE` | Filename does not end in `.pdf`, or the first bytes are not `%PDF-`. | "Please upload a PDF file." |
| 413 | `FILE_TOO_LARGE` | The upload is larger than `5 * 1024 * 1024` bytes (5 MB). | "Your file is too big (max 5 MB)." |
| 422 | `MISSING_FIELD` | `cv` missing/empty name, or `required_skills` / `description` empty or whitespace-only. | Highlight the missing field. |

(`main.py` installs a custom exception handler so FastAPI renders this flat
object instead of nesting it inside another `detail` key.)

---

## 6. Scoring formula (planned for the real implementation)

```
match_score = round(100 * (0.7 * skill_coverage + 0.3 * tfidf_cosine))
```

- **`skill_coverage`** = `matched_skills / total_requested_skills`
  (a plain keyword search of the extracted CV text; 0 if no skills were sent).
- **`tfidf_cosine`** = cosine similarity between the TF-IDF vectors of the CV
  text and the job description (scikit-learn `TfidfVectorizer` +
  `cosine_similarity`), in the range 0–1.
- The weighted result is clamped to 0–100 and returned as an `int`.

Weights are **70 % skills / 30 % wording**: the required skills are the part
the recruiter explicitly asked for, while the description text captures context
the skill list misses.

---

## 7. M0 stub: what is real and what is not

**Real (safe for Member 3 to integrate against now):**

- the routes, the request shape, the response keys/types,
- CORS for the Vite dev server,
- all validation and error codes listed above,
- the 5 MB limit, the `.pdf` extension check and the `%PDF-` magic-byte check.

**Fake (must be replaced in later milestones):**

- `match_score` — computed from *how many of the requested skills the stub
  *pretends* to find*, not from the CV. The stub treats the first
  `max(1, round(0.6 * n))` skills as matched and the rest as missing, so
  `"python, sql, git"` → 2 matched, 1 missing → `66`.
- `strengths` / `weaknesses` — generated from that same split; the last
  strength is always `"Relevant wording found for this job description"`.
  With no skills at all: `strengths = ["CV uploaded successfully (stub analysis)"]`
  and `weaknesses = []`.
- `extracted_chars` — currently the **uploaded file size in bytes**, because
  nothing is parsed yet (the real one reports characters of extracted text).
- The PDF is never opened; `scikit-learn`/`pymupdf` are installed but unused.

So: the numbers change with the request (integration tests are meaningful), but
they do **not** describe the candidate's CV yet.

---

## 8. TODO for the real implementation — Member 4

- [ ] **T1 — PDF text extraction (PyMuPDF).** Open the bytes with `fitz.open(stream=..., filetype="pdf")`, concatenate `page.get_text()`, return the text and `len(text)` as `extracted_chars`. Handle a PDF with no text layer (scanned CV) with a clear `422`/`400` error.
- [ ] **T2 — Similarity scoring (scikit-learn).** `TfidfVectorizer` over `[cv_text, description]` + `cosine_similarity`; combine as `0.7 * coverage + 0.3 * cosine`, clamp to 0–100, return `int`.
- [ ] **T3 — Real strengths / weaknesses.** Search the extracted CV text for each requested skill (word-boundary regex); build `"Skill match: X"` / `"Missing skill: X"`. Add wording-based points (e.g. top overlapping keywords) and cap both lists at `MAX_LIST_ITEMS = 6`.
- [ ] **T4 — Validation hardening.** Verify the multipart **MIME type** (`cv.content_type == ALLOWED_MIME_TYPE`) in addition to extension + magic bytes; reject oversized files from the declared/content length *before* reading them fully; log rejected files (name, size, type) at `WARNING` level.
- [ ] **T5 — Samples.** Add `good_cv.pdf`, `weak_cv.pdf`, `fake.pdf` (and optionally `big.pdf`) as described in [`samples/README.md`](samples/README.md).
- [ ] **T6 — Tests.** Extend `tests/test_analyze.py` with real-PDF cases once extraction exists; keep the current 6 tests green.
- [ ] **T7 — Docs.** Update this README when the stub is replaced (remove the M0 section, confirm the final weights).
