import { supabase } from '../lib/supabaseClient.js';

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

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
// Implementation details:
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
//   5. Return each function's documented result shape with errors instead of
//      throwing, so callers can display failures without crashing.
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
 * Implementation details:
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
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  if (!hasText(examId)) {
    return { data: null, error: new Error('A valid exam id is required.') };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return { data: null, error: userError };
    const studentId = userData?.user?.id;
    if (!studentId) return { data: null, error: new Error('You must be signed in to start an exam.') };

    const inserted = await supabase
      .from('attempts')
      .insert({ exam_id: examId, student_id: studentId, status: 'in_progress' })
      .select('*')
      .single();

    if (!inserted.error) return { data: inserted.data, error: null };

    // PostgreSQL unique(exam_id, student_id): resume the existing attempt only
    // if it is still open. Submitted attempts must not be restarted.
    if (inserted.error.code === '23505') {
      const existing = await supabase
        .from('attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .eq('status', 'in_progress')
        .maybeSingle();
      if (!existing.error && existing.data) {
        return { data: existing.data, error: null };
      }
      return { data: null, error: existing.error ?? inserted.error };
    }

    return { data: null, error: inserted.error };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
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
 * Implementation details:
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
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  if (!hasText(examId)) {
    return { data: null, error: new Error('A valid exam id is required.') };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return { data: null, error: userError };
    const uid = userData?.user?.id;
    if (!uid) return { data: null, error: new Error('You must be signed in.') };

    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', uid)
      .eq('status', 'in_progress')
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
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
 * Implementation details:
 *   supabase.from('answers').upsert(
 *     { attempt_id: attemptId, question_id: questionId,
 *       selected_option_id: selectedOptionId },
 *     { onConflict: 'attempt_id,question_id' },
 *   )
 *   The upsert is what makes "change my mind" work: unique(attempt_id,
 *   question_id) means a plain insert would collide with the first answer.
 */
export async function saveAnswer(attemptId, questionId, selectedOptionId) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') };
  }
  if (!hasText(attemptId) || !hasText(questionId) || !hasText(selectedOptionId)) {
    return { error: new Error('Attempt, question and selected option are required.') };
  }

  try {
    const { error } = await supabase
      .from('answers')
      .upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_id: selectedOptionId,
        },
        { onConflict: 'attempt_id,question_id' },
      );
    return { error };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
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
 * Implementation details:
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
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }
  if (!hasText(attemptId)) {
    return { data: null, error: new Error('A valid attempt id is required.') };
  }
  if (!Array.isArray(answers)) {
    return { data: null, error: new Error('Answers must be provided as an array.') };
  }
  const submitOptions = typeof options === 'boolean'
    ? { autoSubmitted: options }
    : (options && typeof options === 'object' ? options : {});
  const invalidAnswer = answers.some((answer) => (
    !answer
    || typeof answer.question_id !== 'string'
    || !answer.question_id.trim()
    || !Object.prototype.hasOwnProperty.call(answer, 'selected_option_id')
    || (
      answer.selected_option_id !== null
      && (typeof answer.selected_option_id !== 'string' || !answer.selected_option_id.trim())
    )
  ));
  if (invalidAnswer) {
    return { data: null, error: new Error('Each answer needs a question id and a selected option id or null.') };
  }

  try {
    // Grading is intentionally server-side: options.is_correct is inaccessible
    // to students, and submit_attempt() is the only authoritative score writer.
    const { data, error } = await supabase.rpc('submit_attempt', {
      p_attempt_id: attemptId,
      p_answers: answers,
      p_auto_submitted: submitOptions.autoSubmitted === true,
    });
    if (error) return { data: null, error };

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, error: new Error('The submit_attempt RPC returned an invalid result.') };
    }
    const result = {
      score: data.score,
      total: data.total,
      correctCount: data.correctCount ?? data.correct_count,
      questionCount: data.questionCount ?? data.question_count,
    };
    const resultValues = Object.values(result);
    if (
      resultValues.some((value) => !Number.isInteger(value) || value < 0)
      || result.score > result.total
      || result.correctCount > result.questionCount
    ) {
      return { data: null, error: new Error('The submit_attempt RPC returned incomplete or invalid score data.') };
    }

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
