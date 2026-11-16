// ============================================================================
// Owner: Member 2 - Ibrahim Lotfy (Jobs Feed & Timed Quiz)
// File: utils/filterJobs.js
// ----------------------------------------------------------------------------
// Pure function: no React, no network, no side effects.
// "Pure" is the keyword to say in the code review: same input -> same output,
// which makes it trivial to explain and to unit test.
// ============================================================================

/**
 * Filter the jobs array by a free-text query.
 *
 * Matching rules (case-insensitive, trim the query first):
 *   - empty query      -> return ALL jobs unchanged
 *   - match the title
 *   - OR match the company_name
 *   - OR match one of the required_skills (comma separated string on the job)
 *   - OR match the location
 *
 * @param {object[]} jobs  rows from the `jobs` table
 * @param {string} query   text typed in the search box
 * @returns {object[]} a NEW array (never mutate the input)
 *
 * TODO(Member 2 - Milestone M2):
 *   const q = query.trim().toLowerCase();
 *   if (!q) return jobs;
 *   return jobs.filter((job) => [job.title, job.company_name, job.location,
 *     job.required_skills].join(' ').toLowerCase().includes(q));
 */
export function filterJobs(jobs, query) {
  void jobs;
  void query;
  throw new Error('filterJobs() is not implemented yet (Member 2 - Ibrahim Lotfy, M2).');
}

/**
 * Turn "python, sql , GIT" into ['python', 'sql', 'git'].
 * Used by the job card skill chips and by the quiz/AI submit step.
 *
 * @param {string} requiredSkills raw text from the jobs table
 * @returns {string[]}
 *
 * TODO(Member 2 - Milestone M2):
 *   return (requiredSkills || '').split(',').map((s) => s.trim().toLowerCase())
 *     .filter(Boolean);
 */
export function parseSkills(requiredSkills) {
  void requiredSkills;
  throw new Error('parseSkills() is not implemented yet (Member 2 - Ibrahim Lotfy, M2).');
}
