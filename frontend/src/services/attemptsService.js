import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: services/attemptsService.js
// ----------------------------------------------------------------------------
// The single write path for one student's sitting of one exam.
//
// Tables (database/01_schema.sql):
//   attempts(id, exam_id, student_id, started_at, submitted_at, score, status)
//     unique(exam_id, student_id) -> a student sits an exam only once
//     status: 'in_progress' | 'submitted' | 'auto_submitted'
//   answers(id, attempt_id, question_id, selected_option_id)
//     unique(attempt_id, question_id) -> a changed choice overwrites its row
//
// The four names below are a cross-owner contract. TakeExam.jsx (Ibrahim Lotfy,
// member2) calls startAttempt/getOpenAttempt/saveAnswer/submitAttempt too, so
// neither the names nor the return shapes may change:
//   startAttempt(examId)             -> { data: attempt|null, error }
//   getOpenAttempt(examId)           -> { data: attempt|null, error }
//   saveAnswer(attemptId, questionId, selectedOptionId) -> { error }
//   submitAttempt(attemptId, answers, options) -> { data: { score, total,
//                                                   correctCount, questionCount } }
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. startAttempt: insert { exam_id, student_id, status: 'in_progress' } and
//      treat Postgres error 23505 (the unique(exam_id, student_id) rule) as a
//      resume, not a failure: read the row that already exists and return it.
//   2. getOpenAttempt: use .maybeSingle() so "no open attempt" arrives as
//      data: null, not as an error - a page refresh must not look like a crash.
//   3. saveAnswer: upsert on (attempt_id, question_id) so a corrected choice
//      overwrites instead of raising 23505 on the second radio click.
//   4. submitAttempt: exactly one supabase.rpc('submit_attempt', ...) call and
//      never read options.is_correct in the browser (RLS hides it from
//      students; grading belongs in the security-definer function).
//   5. Return { data, error } from every function instead of throwing, so a
//      page can print the message in .alert.alert-error instead of crashing.
// ============================================================================

/**
 * Start a sitting of an exam for the signed-in student, or hand back the
 * sitting that is already open.
 *
 * The "already open" branch is the normal path after a refresh, a closed tab
 * or a second tab: the student must land back on their exam, not on an error.
 *
 * @param {string} examId  exams.id
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ahmed Fayez, member3 - Milestone M3):
 *   1. Take student_id from supabase.auth.getUser(), never from a form field:
 *      the RLS policy compares it with the JWT (database/02_rls.sql).
 *   2. supabase.from('attempts')
 *        .insert({ exam_id: examId, student_id, status: 'in_progress' })
 *        .select().single()
 *   3. if (error?.code === '23505') -> the unique(exam_id, student_id) rule
 *      fired. Read that existing row and return it with error: null: a double
 *      click on "Start exam" must not look like a database fault.
 */
export async function startAttempt(examId) {
  void supabase;
  void examId;

  throw new Error(
    'startAttempt() is not implemented yet (Ahmed Fayez - member3, Milestone M3).',
  );
}

/**
 * Read the attempt the signed-in student still has open on this exam, if any.
 *
 * Called twice in the finished system: to resume an exam after a refresh
 * (TakeExam.jsx) and to disable a second attempt before the exam starts
 * (ExamDetails.jsx). Both belong to Ibrahim Lotfy (member2).
 *
 * @param {string} examId  exams.id
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ahmed Fayez, member3 - Milestone M3):
 *   supabase.from('attempts')
 *     .select('*')
 *     .eq('exam_id', examId)
 *     .eq('student_id', uid)
 *     .eq('status', 'in_progress')
 *     .maybeSingle()
 *   .eq('student_id') is belt and braces because RLS already limits the rows
 *   to the caller's own attempts, but it keeps the intention readable here.
 */
export async function getOpenAttempt(examId) {
  void supabase;
  void examId;

  throw new Error(
    'getOpenAttempt() is not implemented yet (Ahmed Fayez - member3, Milestone M3).',
  );
}

/**
 * Store or overwrite one answer inside a running attempt.
 *
 * Answers are saved as the student clicks, not only on submit: a dead battery
 * or a dropped connection at minute 30 must not cost 30 minutes of work.
 *
 * @param {string} attemptId         attempts.id
 * @param {string} questionId        questions.id
 * @param {string} selectedOptionId  options.id of the chosen option
 * @returns {Promise<{ error: Error|null }>}
 *
 * TODO(Ahmed Fayez, member3 - Milestone M3):
 *   supabase.from('answers').upsert(
 *     { attempt_id: attemptId, question_id: questionId,
 *       selected_option_id: selectedOptionId },
 *     { onConflict: 'attempt_id,question_id' },
 *   )
 *   The upsert is what makes "change my mind" work: unique(attempt_id,
 *   question_id) means a plain insert would collide with the first answer.
 */
export async function saveAnswer(attemptId, questionId, selectedOptionId) {
  void supabase;
  void attemptId;
  void questionId;
  void selectedOptionId;

  throw new Error(
    'saveAnswer() is not implemented yet (Ahmed Fayez - member3, Milestone M3).',
  );
}

/**
 * Close an attempt and let Postgres grade it.
 *
 * The score is deliberately NOT computed here: students may never read the
 * `is_correct` column of `options` (the RLS policy hides it), so the browser
 * cannot compare an answer with the key. Grading therefore lives in the
 * SECURITY DEFINER function `submit_attempt(...)`: it runs with the owner's
 * rights, walks p_answers, counts the correct rows, writes attempts.score and
 * sets the final status. That is also why the client cannot fake a score.
 *
 * @param {string} attemptId  attempts.id, already 'in_progress'
 * @param {Array<{ question_id: string, selected_option_id: string|null }>} answers
 * @param {{ autoSubmitted?: boolean }} [options] true when the timer ran out
 * @returns {Promise<{ data: { score: number, total: number, correctCount: number,
 *   questionCount: number } | null, error: Error|null }>}
 *
 * TODO(Ahmed Fayez, member3 - Milestone M3):
 *   1. supabase.rpc('submit_attempt', {
 *        p_attempt_id: attemptId,
 *        p_answers: answers,
 *        p_auto_submitted: options.autoSubmitted === true,
 *      })
 *   2. Pass the whole answers array in ONE call: N round trips would take
 *      longer than the last seconds of an exam.
 *   3. The RPC writes status 'submitted' or 'auto_submitted' itself, so the
 *      browser never sends a status it would not be allowed to set.
 *   4. Return data in the shape above - ExamResults.jsx (this branch) and
 *      MyResults.jsx (member2) render those four numbers directly.
 */
export async function submitAttempt(attemptId, answers, options = {}) {
  void supabase;
  void attemptId;
  void answers;
  void options;

  throw new Error(
    'submitAttempt() is not implemented yet (Ahmed Fayez - member3, Milestone M3).',
  );
}
