import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: services/examsService.js
// ----------------------------------------------------------------------------
// Every Supabase read the student pages need lives here. Pages stay UI-only, so
// no page builder contains a Postgres query and the three queries below can be
// reviewed side by side.
//
// Convention shared by all three functions: they return { data, error } and
// never throw, so a page writes `const { data, error } = await ...` and renders
// an alert instead of wrapping the call in try/catch. While this file is an M0
// stub the body still throws the "not implemented" error; the M2 body is the one
// that returns the pair.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. getAvailableExams(): three time conditions (is_active, start_time passed,
//      end_time not passed) plus the subject relation embed, ordered by start_time.
//   2. getExamById(examId): same embed, filtered by id, .single() so a bad URL id
//      becomes an error instead of an array the page has to inspect.
//   3. getExamQuestionsWithoutAnswers(examId): questions ordered by order_index
//      with options limited to id + option_text - never is_correct.
// ============================================================================

/**
 * Read the exams a student may sit right now.
 *
 * "Right now" is three conditions, and all three are needed:
 *   - is_active = true        a doctor can hide an exam without deleting it
 *   - start_time <= now       an exam that has not opened yet must not leak
 *   - end_time   >= now       a closed exam disappears from the list
 *
 * `.select('*, subjects(name, code)')` is a Postgres relation embed: exams has a
 * subject_id foreign key, so Postgres joins one subject row and Supabase returns
 * it nested as `exam.subjects`, with no second request from the browser.
 *
 * @returns {Promise<{ data: object[]|null, error: Error|null }>} Resolves with
 *   the error instead of throwing, so a page can show a message and keep working.
 *
 * TODO(Ibrahim Lotfy, member2 - Milestone M2):
 *   const now = new Date().toISOString();
 *   return await supabase
 *     .from('exams')
 *     .select('*, subjects(name, code)')
 *     .eq('is_active', true)
 *     .lte('start_time', now)
 *     .gte('end_time', now)
 *     .order('start_time', { ascending: true });
 */
export async function getAvailableExams() {
  if (!supabase) {
    return { data: [], error: null };
  }
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name, code)')
      .eq('is_active', true)
      .lte('start_time', now)
      .gte('end_time', now)
      .order('start_time', { ascending: true });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Read one exam together with its subject.
 *
 * `.single()` is deliberate: it asks PostgREST for exactly one row, so a wrong id
 * in the URL comes back as `{ data: null, error }` and ExamDetails.jsx can show a
 * "not found" state instead of rendering an empty card.
 *
 * @param {string} examId  the `:examId` route param from /exams/:examId
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ibrahim Lotfy, member2 - Milestone M2):
 *   return await supabase
 *     .from('exams')
 *     .select('*, subjects(name, code)')
 *     .eq('id', examId)
 *     .single();
 */
export async function getExamById(examId) {
  if (!supabase) {
    return { data: null, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name, code)')
      .eq('id', examId)
      .single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Read the questions of one exam for the student who is sitting it.
 *
 * The options are requested as `options(id, option_text)` and NOT as
 * `options(*)`: is_correct is the answer key and a student must never be able to
 * read it. Even with the column missing here, typing a wider select by hand in
 * the browser console is stopped by the RLS policy on options, which is why this
 * narrow select is the second lock and not the only one. Say both out loud in the
 * code review: the browser can fake a request, the database cannot be talked into
 * ignoring its own policy.
 *
 * `.order('order_index')` keeps the questions in the order the doctor wrote them;
 * without it Postgres is free to return them in any order, which would shuffle
 * the exam between two page loads.
 *
 * @param {string} examId
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 *
 * TODO(Ibrahim Lotfy, member2 - Milestone M2):
 *   return await supabase
 *     .from('questions')
 *     .select('id, question_text, marks, order_index, options(id, option_text)')
 *     .eq('exam_id', examId)
 *     .order('order_index', { ascending: true });
 */
export async function getExamQuestionsWithoutAnswers(examId) {
  if (!supabase) {
    return { data: [], error: null };
  }
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, marks, order_index, options(id, option_text)')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}
