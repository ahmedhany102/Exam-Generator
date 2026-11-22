import { gradeExam } from '../utils/gradeExam.js';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: services/gradingService.js
// ----------------------------------------------------------------------------
// NO NETWORK CALLS IN THIS FILE, on purpose.
//
// The authoritative grading runs in Postgres: submit_attempt(p_attempt_id,
// p_answers) in database/01_schema.sql is a security definer function, because a
// student may not read options.is_correct (see the policy matrix in
// database/02_rls.sql). If the browser could read the answer key, an exam would
// be one dev-tools panel away from a perfect score.
//
// This module is therefore the REFERENCE IMPLEMENTATION of the same rule. It is
// used by:
//   - the doctor's result screen, to preview marks for an exam still being built,
//   - the offline checks, to prove the JavaScript result and the SQL result are
//     the same for the same questions and answers.
// Both sides must agree exactly; change one and the other in the same commit.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. Cross-check getExamTotalMarks() against exams.total_marks before an exam
//      is published, so a doctor cannot save 10 marks of questions on a 20-mark
//      exam.
//   2. Use calculatePercentage() for every percentage on screen so no page
//      invents its own rounding.
// ============================================================================

/**
 * Grade answers with the guards the pages need, then hand over to gradeExam().
 *
 * The guards exist because this is called from UI code: a page that renders
 * before the questions arrive passes `null`, and that must look like an empty
 * exam instead of an exception inside a render.
 *
 * @param {Array<object>|null} questions
 * @param {Array<object>|null} answers
 * @returns {{ score: number, total: number, correctCount: number, questionCount: number }}
 */
export function gradeAnswers(questions, answers) {
  if (!Array.isArray(questions)) {
    return { score: 0, total: 0, correctCount: 0, questionCount: 0 };
  }

  return gradeExam(questions, Array.isArray(answers) ? answers : []);
}

/**
 * Sum of the marks of every question in an exam.
 *
 * @param {Array<object>|null} questions
 * @returns {number} 0 when there are no questions
 */
export function getExamTotalMarks(questions) {
  if (!Array.isArray(questions)) return 0;

  return questions.reduce((sum, question) => {
    if (!question) return sum;
    const marks = Number(question.marks);
    return Number.isFinite(marks) && marks > 0 ? sum + marks : sum;
  }, 0);
}

/**
 * Score as a whole percentage, clamped to 0-100.
 *
 * Integer, because the result table shows "80%" and never "79.99999%"; clamped,
 * because a seed whose total is wrong or a score edited by hand must not render
 * "140%" on a result page.
 *
 * @param {number} score
 * @param {number} total
 * @returns {number} integer between 0 and 100
 */
export function calculatePercentage(score, total) {
  const safeScore = Number(score);
  const safeTotal = Number(total);

  if (!Number.isFinite(safeScore) || !Number.isFinite(safeTotal) || safeTotal <= 0) return 0;

  const percentage = Math.round((safeScore / safeTotal) * 100);
  if (percentage < 0) return 0;
  if (percentage > 100) return 100;
  return percentage;
}
