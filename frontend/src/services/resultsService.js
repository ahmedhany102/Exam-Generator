import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: services/resultsService.js
// ----------------------------------------------------------------------------
// Every read of `attempts` and `answers` on the results side lives here, so the
// pages (MyResults, ExamResults, the result details view) stay UI-only and hold
// no SQL strings.
//
// No write in this file. A score is written once, by submit_attempt(); students
// have no UPDATE policy on attempts (database/02_rls.sql) precisely so a result
// cannot be rewritten from the console after it has been seen.
//
// Every query below relies on RLS as the real filter - the .eq() filters are
// there to make the intention readable during review, not to provide security.
// Each function will return { data, error } and never throw; the M0 stubs throw
// so that nobody wires a page to an empty implementation by accident.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. Return { data, error } from every function (never throw) and let the page
//      render .alert-error when error is set.
//   2. Show exams.title + subjects.name on the student's own list (they have no
//      access to the answer key, only to their own score).
//   3. On the doctor screen, sort by score so the pass/fail split is visible.
// ============================================================================

/**
 * The signed-in student's own attempts, newest first, with the exam and subject
 * attached so the list needs only one request.
 *
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   supabase.from('attempts')
 *     .select('*, exams(title, total_marks, subjects(name))')
 *     .eq('student_id', user.id)
 *     .order('submitted_at', { ascending: false })
 */
export async function getMyResults() {
  void supabase;

  throw new Error(
    'getMyResults() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}

/**
 * All attempts for one exam, for the doctor who owns it, with the student name
 * and email embedded.
 *
 * Note for M4: a doctor may read the name of a student only through the
 * profiles policy in database/02_rls.sql, which grants a doctor exactly the
 * student rows - nothing more.
 *
 * @param {string} examId
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   supabase.from('attempts')
 *     .select('*, profiles(full_name, email)')
 *     .eq('exam_id', examId)
 */
export async function getExamResultsForDoctor(examId) {
  void supabase;
  void examId;

  throw new Error(
    'getExamResultsForDoctor() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}

/**
 * One attempt with its answers, plus the exam and its questions, so the result
 * details view can show what the student picked next to the correct option.
 *
 * Only a doctor, an admin, or the student who owns the attempt can read this -
 * again enforced by RLS, not by these filters.
 *
 * @param {string} attemptId
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   supabase.from('attempts')
 *     .select('*, exams(*, questions(*, options(*))), answers(*)')
 *     .eq('id', attemptId)
 *     .single()
 */
export async function getAttemptReview(attemptId) {
  void supabase;
  void attemptId;

  throw new Error(
    'getAttemptReview() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}
