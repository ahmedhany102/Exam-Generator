// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: utils/validateCvFile.js
// ----------------------------------------------------------------------------
// Client-side check BEFORE the file is uploaded to Supabase Storage.
// This is "defence in depth": the browser checks first (fast feedback), and the
// Python service checks the real bytes again (the browser check can be bypassed
// by anyone with a console, so it must never be the only layer).
//
// Rules for this MVP:
//   - must be a .pdf file (extension AND MIME type application/pdf)
//   - must be smaller than 5 MB (5 * 1024 * 1024 bytes)
//   - must have a name
// ============================================================================

/** 5 MB in bytes - the same limit as the storage bucket and the AI service. */
export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Validate a File coming from <input type="file">.
 *
 * @param {File|null} file
 * @returns {{ valid: boolean, error: string|null }}
 *   Always returns an object (never throws) so the UI can simply do:
 *     const { valid, error } = validateCvFile(file);
 *
 * TODO(Member 1 - Milestone M1):
 *   1. no file            -> { valid: false, error: 'Please choose a PDF file.' }
 *   2. size > MAX         -> { valid: false, error: 'Your CV must be smaller than 5 MB.' }
 *   3. extension not .pdf -> { valid: false, error: 'Only PDF files are allowed.' }
 *   4. type not application/pdf -> same error as 3
 *   5. otherwise          -> { valid: true, error: null }
 *   Also log INVALID_FILE_BLOCKED with logSecurityEvent() from the caller
 *   (Profile.jsx) so the security page shows the blocked attempt.
 */
export function validateCvFile(file) {
  void file;
  throw new Error('validateCvFile() is not implemented yet (Member 1 - Ahmed Hany, M1).');
}
