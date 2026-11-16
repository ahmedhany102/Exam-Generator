"""Candidate Portal - AI service (M0 scaffold).

This file is the whole microservice: a single, self-contained FastAPI module.
At milestone M0 it is a *stub*: it accepts the real HTTP requests, performs the
real validation checks, and then returns a fake (but request-derived) analysis
result so the frontend team can wire up their `fetch` calls today.

Owner: Member 4 (Ibrahim Abduljawad).
"""

from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# ===== M0 STUB =====
#
# WHAT THIS MEANS
#   Everything below that produces a "match score", "strengths" or "weaknesses"
#   is FAKE. The numbers are derived from the request (which skills were sent,
#   how big the uploaded file was) so that integration testing is meaningful
#   instead of random, but no CV is really read and no machine learning runs.
#
# TODOs FOR THE REAL IMPLEMENTATION (Member 4, later milestones)
#   1. Text extraction: open the uploaded PDF with PyMuPDF (import fitz) and
#      read page text -> that becomes `extracted_chars` and the CV text.
#   2. Scoring: turn the CV text and the job description into TF-IDF vectors
#      with scikit-learn and compute cosine similarity, then combine it with
#      skill coverage: 0.7 * skill coverage + 0.3 * TF-IDF cosine similarity.
#   3. Strengths / weaknesses: generate them from the real comparison
#      (which skills were found in the CV text, which keywords are missing),
#      not from "the first 60% of the list".
#   4. Validation hardening: check the real MIME type (not just the filename),
#      enforce the 5 MB limit before reading the whole file into memory, keep
#      the %PDF- magic-byte check, and log rejected file types for debugging.
#
# ===== END M0 STUB =====


# ---------------------------------------------------------------------------
# Configuration constants
# Keep these at module level so tests, the README and the real implementation
# all agree on the same numbers.
# ---------------------------------------------------------------------------

# Largest upload we accept: 5 MB. Written as a computation so the intent is
# obvious (5 megabytes = 5 * 1024 * 1024 bytes).
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

# The only file type we accept. Used by the real implementation for the MIME
# check (TODO 4); the stub only compares the filename extension and magic bytes.
ALLOWED_MIME_TYPE = "application/pdf"

# The two addresses the Vite dev server uses (`npm run dev`). Browsers block
# cross-origin requests unless the server says these origins are allowed.
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# Maximum number of items we return in the strengths / weaknesses lists, so a
# CV with 40 skills cannot produce an unreadably long JSON response.
MAX_LIST_ITEMS = 6

# The first bytes every real PDF file starts with ("magic bytes"). Reading them
# is a cheap, honest way to reject a .txt file that was simply renamed to .pdf.
PDF_MAGIC_BYTES = b"%PDF-"


# ---------------------------------------------------------------------------
# The FastAPI application object
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Candidate Portal AI Service",
    description="CV analysis microservice (M0 stub).",
    version="0.1.0",
)

# Allow the frontend (running on port 5173) to call this API from the browser.
# "allow_methods" and "allow_headers" are wide open because this is a local
# university project, not a public production service.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Render every HTTP error as a flat JSON object.

    FastAPI normally wraps a dict `detail` inside another detail key, producing
    `{"detail": {"detail": "...", "code": "..."}}`. The frontend contract wants
    the flat body `{"detail": "<message>", "code": "<CODE>"}`, so this handler
    returns the dict as the response body itself.

    Args:
        request: The incoming request (unused, required by FastAPI's signature).
        exc: The exception that was raised somewhere in the app.

    Returns:
        A JSONResponse whose body is exactly what we want the frontend to see.
    """
    # Our own errors carry a dict detail like {"detail": ..., "code": ...}.
    # Any other error (e.g. a 404 for an unknown URL) carries a plain string,
    # so we wrap that string in the usual {"detail": ...} shape.
    body: Dict[str, Any] = exc.detail if isinstance(exc.detail, dict) else {"detail": exc.detail}
    return JSONResponse(status_code=exc.status_code, content=body, headers=exc.headers)


def raise_api_error(status_code: int, message: str, code: str) -> None:
    """Raise an HTTPException that the handler above turns into a flat body.

    Args:
        status_code: The HTTP status to send (400, 413, 422, ...).
        message: Human-readable explanation for the frontend / logs.
        code: Short machine-readable error code the frontend can switch on.

    Raises:
        HTTPException: Always. This function never returns normally.
    """
    raise HTTPException(status_code=status_code, detail={"detail": message, "code": code})


# ---------------------------------------------------------------------------
# Skill parsing helpers
# ---------------------------------------------------------------------------


def parse_skills(required_skills: str) -> List[str]:
    """Turn the comma-separated `required_skills` field into a clean list.

    The frontend sends one text field such as "python, sql, git". This function
    splits it on commas, strips surrounding spaces, lowercases everything (so
    "Python" and "python" count as the same skill), drops empty entries (trailing
    commas are easy to produce by accident) and removes duplicates while keeping
    the original order.

    Args:
        required_skills: Raw text from the multipart form field.

    Returns:
        A de-duplicated list of lowercase skill names, e.g. ["python", "sql"].
    """
    skills: List[str] = []

    for raw_part in required_skills.split(","):
        skill = raw_part.strip().lower()

        # Skip empty pieces (e.g. ",," or a trailing comma) and duplicates.
        if skill and skill not in skills:
            skills.append(skill)

    return skills


def split_matched_skills(skills: List[str]) -> "tuple[List[str], List[str]]":
    """Fake the "which skills does this CV have?" decision for the stub.

    TODO 1-3: the real implementation will search the extracted CV text for
    each skill and split the list based on what it actually finds. Right now we
    pretend that roughly the first 60% of the requested skills were found, so
    the numbers still react to the request.

    Args:
        skills: Cleaned list of required skills from `parse_skills`.

    Returns:
        A (matched, missing) pair of lists. Together they contain exactly the
        input skills, each one only once.
    """
    total = len(skills)
    if total == 0:
        return [], []

    # "At least one skill matches" keeps the demo/UI sensible for short lists;
    # the min() clamp stops the count from ever exceeding the list length.
    matched_count = max(1, round(total * 0.6))
    matched_count = min(matched_count, total)

    return skills[:matched_count], skills[matched_count:]


def build_mock_result(
    matched_skills: List[str],
    missing_skills: List[str],
    extracted_chars: int,
) -> Dict[str, Any]:
    """Assemble the response body expected by the frontend contract.

    This builds the JSON keys `match_score`, `strengths`, `weaknesses`,
    `matched_skills`, `missing_skills` and `extracted_chars`. The values are
    fake at M0 (see the M0 STUB banner) but the shape is final.

    Args:
        matched_skills: Skills the stub pretends were found in the CV.
        missing_skills: Skills the stub pretends were not found.
        extracted_chars: How many characters of text we "extracted" (the stub
            reports the size of the uploaded file instead).

    Returns:
        A dictionary ready to be returned as the HTTP JSON response.
    """
    total = len(matched_skills) + len(missing_skills)

    # Skill coverage = share of the required skills that were matched.
    # With no skills at all there is nothing to cover, so coverage is 0.
    coverage = (len(matched_skills) / total) if total > 0 else 0.0

    # Convert to a 0-100 integer score, clamped so rounding can never produce
    # a value outside the range the frontend expects.
    match_score = min(100, max(0, int(coverage * 100)))

    if total == 0:
        # Nothing was requested: give the user something reassuring.
        strengths: List[str] = ["CV uploaded successfully (stub analysis)"]
        weaknesses: List[str] = []
    else:
        strengths = [f"Skill match: {skill}" for skill in matched_skills]
        strengths.append("Relevant wording found for this job description")
        weaknesses = [f"Missing skill: {skill}" for skill in missing_skills]

    # Trim to the agreed maximum so the response stays short and predictable.
    strengths = strengths[:MAX_LIST_ITEMS]
    weaknesses = weaknesses[:MAX_LIST_ITEMS]

    return {
        "match_score": match_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "extracted_chars": extracted_chars,
    }


def analyze_cv_stub(required_skills: str, description: str, extracted_chars: int) -> Dict[str, Any]:
    """Produce the fake analysis for one CV submission.

    This is the function the real implementation will replace: PyMuPDF text
    extraction and TF-IDF cosine similarity will live here (TODO 1 and 2).

    Args:
        required_skills: Raw comma-separated skills from the form.
        description: Job description text. Unused by the stub - the real
            implementation compares it against the CV text.
        extracted_chars: Number of characters "extracted" from the CV.

    Returns:
        The response dictionary produced by `build_mock_result`.
    """
    skills = parse_skills(required_skills)
    matched_skills, missing_skills = split_matched_skills(skills)

    # `description` is validated by the endpoint but not needed yet; keeping it
    # in the signature means the endpoint does not have to change later.
    _ = description

    return build_mock_result(matched_skills, missing_skills, extracted_chars)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def validate_text_fields(required_skills: str, description: str, cv: Optional[UploadFile]) -> None:
    """Check that the client sent every required field.

    Args:
        required_skills: Raw comma-separated skills from the form.
        description: Job description text from the form.
        cv: The uploaded file, or None when the field was not sent at all.

    Raises:
        HTTPException: 422 MISSING_FIELD when a field is missing or blank.
    """
    if cv is None or not cv.filename:
        raise_api_error(422, "The 'cv' file field is required.", "MISSING_FIELD")

    if not required_skills or not required_skills.strip():
        raise_api_error(422, "The 'required_skills' field cannot be empty.", "MISSING_FIELD")

    if not description or not description.strip():
        raise_api_error(422, "The 'description' field cannot be empty.", "MISSING_FIELD")


async def read_and_validate_cv(cv: UploadFile) -> bytes:
    """Read the upload and reject anything that is not a small PDF.

    The stub already performs the two checks the frontend needs to test:
    the file must look like a PDF (extension + magic bytes) and it must respect
    the size limit.

    TODO 4: the real implementation will additionally verify the MIME type from
    the multipart headers, check the declared size before reading, and log
    rejected file types.

    Args:
        cv: The uploaded file. Already known to have a filename.

    Returns:
        The raw file bytes, ready to be handed to the (future) PDF parser.

    Raises:
        HTTPException: 400 INVALID_FILE_TYPE for a non-PDF upload,
            413 FILE_TOO_LARGE when the file exceeds `MAX_FILE_SIZE_BYTES`.
    """
    filename = (cv.filename or "").lower()

    # Cheap first filter: look at the extension. Case-insensitive so "CV.PDF"
    # is accepted too.
    if not filename.endswith(".pdf"):
        raise_api_error(
            400,
            "Only PDF files are supported. Please upload a file ending in .pdf.",
            "INVALID_FILE_TYPE",
        )

    # Read the whole upload into memory. It is small (max 5 MB), and we never
    # write uploaded files to disk.
    contents = await cv.read()

    # Second, stronger filter: a real PDF starts with the bytes "%PDF-".
    # This catches a .txt file that was simply renamed to .pdf.
    if not contents.startswith(PDF_MAGIC_BYTES):
        raise_api_error(
            400,
            "This file is not a valid PDF (missing the %PDF- signature).",
            "INVALID_FILE_TYPE",
        )

    # Size limit. 413 is the standard status for "request entity too large".
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise_api_error(
            413,
            "The CV is too large. The maximum size is 5 MB.",
            "FILE_TOO_LARGE",
        )

    return contents


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> Dict[str, str]:
    """Liveness probe used by the frontend, CI and the README smoke test.

    Returns:
        {"status": "ok"} with HTTP 200 when the service is running.
    """
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    cv: Optional[UploadFile] = File(default=None),
    required_skills: str = Form(default=""),
    description: str = Form(default=""),
) -> Dict[str, Any]:
    """Analyse one uploaded CV against a job description.

    The handler stays thin on purpose: it validates the input, then delegates
    the actual work to `analyze_cv_stub` (later: the real analyser).

    Args:
        cv: The candidate's CV as a PDF upload (multipart/form-data field "cv").
        required_skills: Comma-separated skills, e.g. "python, sql, git".
        description: The job description text.

    Returns:
        The analysis result dictionary (match_score, strengths, weaknesses,
        matched_skills, missing_skills, extracted_chars).
    """
    # 1. Are all three fields present and non-blank?
    validate_text_fields(required_skills, description, cv)

    # 2. Is it really a PDF, and is it small enough?
    contents = await read_and_validate_cv(cv)  # type: ignore[arg-type]

    # 3. Fake analysis. TODO 1-3: replace with PyMuPDF + scikit-learn.
    #    `extracted_chars` currently reports the uploaded byte count; the real
    #    implementation will report the number of characters of CV text.
    return analyze_cv_stub(required_skills, description, len(contents))


# Entry point for `python main.py` (development only - production would run
# uvicorn directly). reload=True restarts the server whenever main.py changes.
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
