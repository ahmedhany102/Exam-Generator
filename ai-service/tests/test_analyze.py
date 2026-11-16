"""Tests for the Candidate Portal AI service (M0 stub).

Run them from the `ai-service/` folder:

    pytest tests/test_analyze.py -v

These tests use FastAPI's TestClient, which calls the app in-process: no server
needs to be running and no real PDF is required. The stub only looks at the
"%PDF-" magic bytes, so a tiny fake PDF is enough.

They check three things:
  1. the success contract (keys, types, sensible values),
  2. that all three input fields are validated (MISSING_FIELD),
  3. that non-PDF and oversized uploads are rejected with the right code.
"""

import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Make sure `import main` works no matter which folder pytest was started from.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import MAX_FILE_SIZE_BYTES, app  # noqa: E402  (import after sys.path fix)

# One client is enough: TestClient is stateless here.
client = TestClient(app)

# A minimal but "real enough" PDF: the stub only checks the %PDF- signature.
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n%%EOF\n"

# A realistic job description, to make the wording of the tests readable.
JOB_DESCRIPTION = (
    "We are looking for a backend developer to build REST APIs. "
    "Experience with Python, SQL databases and Git is required."
)


def post_analyze(
    pdf_bytes: bytes = VALID_PDF_BYTES,
    filename: str = "cv.pdf",
    required_skills: str = "python,sql,git",
    description: str = JOB_DESCRIPTION,
):
    """POST to /analyze with a multipart body, exactly like the frontend does.

    Args:
        pdf_bytes: Raw bytes put in the "cv" file field.
        filename: Filename sent with the upload (drives the extension check).
        required_skills: Value of the "required_skills" text field.
        description: Value of the "description" text field.

    Returns:
        The httpx response returned by the app.
    """
    return client.post(
        "/analyze",
        files={"cv": (filename, pdf_bytes, "application/pdf")},
        data={"required_skills": required_skills, "description": description},
    )


# ---------------------------------------------------------------------------
# 1. Health check
# ---------------------------------------------------------------------------


def test_health_returns_ok():
    """GET /health must answer 200 with exactly {"status": "ok"}."""
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# 2. Happy path
# ---------------------------------------------------------------------------


def test_analyze_valid_pdf_returns_contract():
    """A valid PDF + valid fields must return 200 and the full response shape."""
    response = post_analyze()

    assert response.status_code == 200
    body = response.json()

    # Exactly these keys - nothing missing, nothing extra.
    assert set(body.keys()) == {
        "match_score",
        "strengths",
        "weaknesses",
        "matched_skills",
        "missing_skills",
        "extracted_chars",
    }

    # Types the frontend relies on.
    assert isinstance(body["match_score"], int)
    assert isinstance(body["strengths"], list)
    assert isinstance(body["weaknesses"], list)
    assert isinstance(body["matched_skills"], list)
    assert isinstance(body["missing_skills"], list)
    assert isinstance(body["extracted_chars"], int)

    # Every list item is plain text.
    for item in body["strengths"] + body["weaknesses"]:
        assert isinstance(item, str)

    # Score is a percentage.
    assert 0 <= body["match_score"] <= 100

    # Every requested skill appears exactly once, in one of the two lists.
    all_skills = body["matched_skills"] + body["missing_skills"]
    assert sorted(all_skills) == ["git", "python", "sql"]
    assert len(all_skills) == 3

    # The stub reports the uploaded byte count as "extracted_chars".
    assert body["extracted_chars"] == len(VALID_PDF_BYTES)


# ---------------------------------------------------------------------------
# 3. Missing / empty text fields
# ---------------------------------------------------------------------------


def test_empty_required_skills_returns_422_missing_field():
    """A blank required_skills field must be rejected as MISSING_FIELD."""
    response = post_analyze(required_skills="   ")

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "MISSING_FIELD"
    assert isinstance(body["detail"], str)


# ---------------------------------------------------------------------------
# 4. and 5. Wrong file type
# ---------------------------------------------------------------------------


def test_non_pdf_bytes_with_pdf_name_returns_400_invalid_file_type():
    """A .txt renamed to .pdf is caught by the %PDF- magic-byte check."""
    response = post_analyze(pdf_bytes=b"this is definitely not a pdf")

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "INVALID_FILE_TYPE"
    assert isinstance(body["detail"], str)


def test_txt_filename_returns_400_invalid_file_type():
    """A wrong extension is rejected before the file is even looked at."""
    response = post_analyze(filename="cv.txt")

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "INVALID_FILE_TYPE"
    assert isinstance(body["detail"], str)


# ---------------------------------------------------------------------------
# 6. Oversized upload
# ---------------------------------------------------------------------------


def test_oversized_pdf_returns_413_file_too_large():
    """Anything bigger than the 5 MB limit must be rejected with 413."""
    # Valid PDF header + filler, so only the size check can reject it.
    big_pdf = b"%PDF-" + b"0" * (5 * 1024 * 1024)
    assert len(big_pdf) > MAX_FILE_SIZE_BYTES

    response = post_analyze(pdf_bytes=big_pdf)

    assert response.status_code == 413
    body = response.json()
    assert body["code"] == "FILE_TOO_LARGE"
    assert isinstance(body["detail"], str)
