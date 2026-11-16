import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Member 3 - Ahmed Fayez (AI Integration & Applications Dashboard)
// File: services/applicationsService.js
// ----------------------------------------------------------------------------
// All reads and writes of the `applications` table.
//
// Columns: id, user_id, job_id, quiz_score (0-5), ai_match_score (0-100),
//          ai_strengths (jsonb array), ai_weaknesses (jsonb array),
//          status ('Submitted'), created_at
//
// RLS reminder: the client may only INSERT and SELECT its own rows. There is
// deliberately no UPDATE policy - a candidate must not be able to edit the
// scores that were submitted.
// ============================================================================

/**
 * Insert one finished application.
 *
 * @param {object} application
 * @param {string} application.jobId
 * @param {number} application.quizScore        0-5, calculated in JS by scoreQuiz()
 * @param {number} application.aiMatchScore     0-100, from the AI service
 * @param {string[]} application.aiStrengths
 * @param {string[]} application.aiWeaknesses
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Member 3 - Milestone M3):
 *   - get the user id from supabase.auth.getUser()
 *   - supabase.from('applications').insert({ user_id, job_id, quiz_score,
 *       ai_match_score, ai_strengths, ai_weaknesses })
 *   - translate the unique-constraint error (code 23505) into a friendly
 *     "You have already applied for this job" message.
 */
export async function submitApplication(application) {
  void supabase;
  void application;
  throw new Error(
    'submitApplication() is not implemented yet (Member 3 - Ahmed Fayez, M3).',
  );
}

/**
 * The dashboard query: my applications + the job title and company name.
 * One request thanks to the foreign key relationship in Postgres:
 *   select('id, quiz_score, ai_match_score, ..., jobs(title, company_name)')
 *
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 *
 * TODO(Member 3 - Milestone M3): implement with .order('created_at', { ascending: false }).
 */
export async function getMyApplications() {
  void supabase;
  throw new Error(
    'getMyApplications() is not implemented yet (Member 3 - Ahmed Fayez, M3).',
  );
}

/**
 * Has the current user already applied for this job?
 * Used by JobDetails.jsx to disable the Apply button (Member 2 calls it).
 *
 * @param {string} jobId
 * @returns {Promise<boolean>}
 *
 * TODO(Member 3 - Milestone M3):
 *   select('id').eq('job_id', jobId).eq('user_id', uid).maybeSingle()
 */
export async function hasApplied(jobId) {
  void supabase;
  void jobId;
  throw new Error('hasApplied() is not implemented yet (Member 3 - Ahmed Fayez, M3).');
}
