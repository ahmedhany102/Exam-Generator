import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Member 2 - Ibrahim Lotfy (Jobs Feed & Timed Quiz)
// File: services/jobsService.js
// ----------------------------------------------------------------------------
// Two read-only queries against the `jobs` table. There is no insert/update
// here on purpose: jobs are created from the Supabase dashboard (or by
// database/04_seed_jobs.sql), and the RLS policy only allows authenticated
// SELECT.
// ============================================================================

/**
 * Fetch every job for the jobs feed.
 * The feed is small in this MVP, so we load all rows and filter in the
 * browser with utils/filterJobs.js - no server-side search needed.
 *
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 *
 * TODO(Member 2 - Milestone M2):
 *   supabase.from('jobs').select('*').order('created_at', { ascending: false })
 */
export async function getJobs() {
  void supabase;
  throw new Error('getJobs() is not implemented yet (Member 2 - Ibrahim Lotfy, M2).');
}

/**
 * Fetch one job (with its 5 quiz questions) for the details / quiz pages.
 * @param {string} jobId
 *
 * TODO(Member 2 - Milestone M2):
 *   supabase.from('jobs').select('*').eq('id', jobId).single()
 */
export async function getJobById(jobId) {
  void supabase;
  void jobId;
  throw new Error('getJobById() is not implemented yet (Member 2 - Ibrahim Lotfy, M2).');
}
