import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: services/profileService.js
// ----------------------------------------------------------------------------
// Everything that touches the `profiles` table and the `cvs` storage bucket.
// Keeping it here means Profile.jsx contains only UI code and no SQL strings.
//
// Storage layout (decided in database/03_storage.sql):
//   bucket "cvs" (private)  ->  path "{user_id}/cv.pdf"
// The path shape is also what the storage RLS policy checks, so do not change
// it: (storage.foldername(name))[1] = auth.uid()::text
// ============================================================================

/**
 * Read the current user's profile row.
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Member 1 - Milestone M1):
 *   supabase.from('profiles').select('*').eq('id', user.id).single()
 */
export async function getProfile() {
  void supabase;
  throw new Error('getProfile() is not implemented yet (Member 1 - Ahmed Hany, M1).');
}

/**
 * Update full_name / job_title of the current user.
 * @param {{ full_name?: string, job_title?: string }} updates
 *
 * TODO(Member 1 - Milestone M1):
 *   supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() })
 *     .eq('id', user.id)
 */
export async function updateProfile(updates) {
  void supabase;
  void updates;
  throw new Error('updateProfile() is not implemented yet (Member 1 - Ahmed Hany, M1).');
}

/**
 * Upload a validated PDF CV and remember its path in profiles.cv_url.
 * @param {File} file  already validated by utils/validateCvFile.js
 *
 * TODO(Member 1 - Milestone M1):
 *   1. const path = `${user.id}/cv.pdf`
 *   2. supabase.storage.from('cvs').upload(path, file, { upsert: true,
 *        contentType: 'application/pdf' })
 *   3. save `path` into profiles.cv_url (not a public URL - the bucket is private)
 *   4. log a CV_UPLOADED / INVALID_FILE_BLOCKED row via securityLogService
 */
export async function uploadCv(file) {
  void supabase;
  void file;
  throw new Error('uploadCv() is not implemented yet (Member 1 - Ahmed Hany, M1).');
}

/**
 * Download the current user's stored CV as a Blob.
 * Member 3 needs this to send the real file to the Python AI service.
 *
 * @param {string} cvPath  value of profiles.cv_url, e.g. "3f2c.../cv.pdf"
 * @returns {Promise<{ data: Blob|null, error: Error|null }>}
 *
 * TODO(Member 1 - Milestone M1):
 *   supabase.storage.from('cvs').download(cvPath)
 */
export async function downloadCv(cvPath) {
  void supabase;
  void cvPath;
  throw new Error('downloadCv() is not implemented yet (Member 1 - Ahmed Hany, M1).');
}
