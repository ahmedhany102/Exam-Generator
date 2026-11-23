// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: utils/filterExams.js
// ----------------------------------------------------------------------------
// Search and status helpers for the exam list. "Pure" here means: no imports, no
// Supabase client, no setState - the same arguments always produce the same
// result. That is what makes them safe to call on every keystroke (no request per
// letter) and what makes them easy to defend without running the app.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. filterExams(): lower-case the query once, then match title, description
//      and the embedded subject name; treat an empty subjectId as "all subjects";
//      return a new array with .filter() so the state array is never mutated.
//   2. getExamStatus(): compare start_time / end_time with `now` and fall back to
//      is_active, so a hidden exam is never reported as open.
//   3. parseDuration(): turn 45 into "45 min" for the card and the rules panel.
// ============================================================================

/**
 * Filter the exams a page already holds.
 *
 * Why in the browser: the student page loads the open exams once, and searching
 * inside that list is instant and works while the network is slow. At this size
 * (tens of exams) a Postgres full-text query would add a round trip per keystroke
 * and buy nothing.
 *
 * @param {object[]} exams  rows from getAvailableExams(), each with
 *                          { title, description, subjects: { name, code } | null }
 * @param {string} query    free text typed by the student; '' means "no filter"
 * @param {string|null} subjectId  chosen subject, or '' / null for all subjects
 * @returns {object[]} a NEW array; the input array is never mutated or reordered.
 *
 * TODO(Ibrahim Lotfy, member2 - Milestone M2):
 *   const term = (query ?? '').trim().toLowerCase();
 *   return (exams ?? []).filter((exam) => { ... });
 *   Matching is case-insensitive on title, description and subjects.name, and the
 *   subject filter is skipped when subjectId is falsy.
 */
export function filterExams(exams, query, subjectId) {
  const term = (query ?? '').trim().toLowerCase();
  return (exams ?? []).filter((exam) => {
    if (!exam) return false;
    if (subjectId && exam.subject_id !== subjectId) {
      return false;
    }
    if (!term) {
      return true;
    }
    const title = (exam.title ?? '').toLowerCase();
    const description = (exam.description ?? '').toLowerCase();
    const subjectName = (exam.subjects?.name ?? '').toLowerCase();
    const subjectCode = (exam.subjects?.code ?? '').toLowerCase();
    return (
      title.includes(term) ||
      description.includes(term) ||
      subjectName.includes(term) ||
      subjectCode.includes(term)
    );
  });
}

/**
 * Decide which badge an exam card shows.
 *
 * The order matters: is_active is checked first, because an exam the doctor
 * switched off must never be advertised as open even if its date window says it
 * is. Then the window decides between 'upcoming', 'open' and 'closed'.
 *
 * @param {object} exam  { start_time, end_time, is_active }
 * @param {Date} [now]   injected so the function is testable without waiting;
 *                       defaults to the current time.
 * @returns {'upcoming'|'open'|'closed'}
 *
 * TODO(Ibrahim Lotfy, member2 - Milestone M2):
 *   if (exam.is_active === false) return 'closed';
 *   if (now < new Date(exam.start_time)) return 'upcoming';
 *   if (now > new Date(exam.end_time)) return 'closed';
 *   return 'open';
 */
export function getExamStatus(exam, now = new Date()) {
  if (!exam || exam.is_active === false) return 'closed';
  const nowDate = now instanceof Date ? now : new Date(now);
  if (exam.start_time && nowDate < new Date(exam.start_time)) return 'upcoming';
  if (exam.end_time && nowDate > new Date(exam.end_time)) return 'closed';
  return 'open';
}

export function parseDuration(minutes) {
  const num = Number(minutes);
  if (!minutes || isNaN(num) || num <= 0) {
    return '0 min';
  }
  return `${num} min`;
}
