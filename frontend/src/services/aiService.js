import { AI_SERVICE_URL } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Member 3 - Ahmed Fayez (AI Integration & Applications Dashboard)
// File: services/aiService.js
// ----------------------------------------------------------------------------
// The ONLY place in the frontend that talks to the Python FastAPI service.
//
// Endpoint: POST {VITE_AI_SERVICE_URL}/analyze   (multipart/form-data)
//   cv               -> the PDF file
//   required_skills  -> job.required_skills, e.g. "python, sql, git"
//   description      -> job.description
//
// Response 200:
//   { match_score, strengths[], weaknesses[], matched_skills[],
//     missing_skills[], extracted_chars }
//
// Error response (any non-2xx):
//   { detail: "<message>", code: "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" |
//     "EMPTY_OR_UNREADABLE_PDF" | "MISSING_FIELD" | "ANALYSIS_FAILED" }
//
// IMPORTANT: never set the "Content-Type" header manually. The browser must
// add "multipart/form-data; boundary=..." itself when the body is a FormData.
// ============================================================================

/** Maps the backend error code to a message a candidate can understand. */
export const AI_ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Your CV must be a real PDF file. Please upload a different file.',
  FILE_TOO_LARGE: 'Your CV is larger than 5 MB. Please upload a smaller PDF.',
  EMPTY_OR_UNREADABLE_PDF:
    'We could not read any text from your CV. Scanned images are not supported yet.',
  MISSING_FIELD: 'The job information is incomplete, so the analysis could not run.',
  ANALYSIS_FAILED: 'The AI analysis failed. Please try again in a moment.',
  SERVICE_OFFLINE:
    'The AI service is not running. Start it with "uvicorn main:app --port 8000" and try again.',
};

/**
 * Send one CV + one job to the AI service and return the analysis.
 *
 * @param {File|Blob} cvFile  the PDF (a File from <input type="file"> or a Blob
 *                            downloaded from Supabase Storage)
 * @param {{ required_skills: string, description: string, title?: string }} job
 * @returns {Promise<{ match_score: number, strengths: string[],
 *                     weaknesses: string[], matched_skills: string[],
 *                     missing_skills: string[], extracted_chars: number }>}
 *
 * TODO(Member 3 - Milestone M3):
 *   1. const formData = new FormData();
 *      formData.append('cv', cvFile, 'cv.pdf');
 *      formData.append('required_skills', job.required_skills);
 *      formData.append('description', job.description);
 *   2. const response = await fetch(`${AI_SERVICE_URL}/analyze`, { method: 'POST', body: formData });
 *   3. If !response.ok -> read the JSON, throw new Error(AI_ERROR_MESSAGES[body.code] || ...)
 *      and keep body.code on the error object so Applying.jsx can react to it.
 *   4. Wrap the fetch in try/catch: a TypeError means the service is offline
 *      (SERVICE_OFFLINE message).
 *   5. Round match_score to an integer before returning it.
 */
export async function analyzeCv(cvFile, job) {
  void AI_SERVICE_URL;
  void cvFile;
  void job;
  throw new Error('analyzeCv() is not implemented yet (Member 3 - Ahmed Fayez, M3).');
}
