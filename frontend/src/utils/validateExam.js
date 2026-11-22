// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: utils/validateExam.js
// ----------------------------------------------------------------------------
// Client-side validation for the dynamic exam builder (pages/CreateExam.jsx).
//
// This module imports nothing and touches no Supabase client on purpose: it is
// a pure function of what the doctor typed. That keeps the page free of rules,
// makes the rules readable in a code review, and lets anyone check them without
// a database connection.
//
// The database is still the last line of defence (NOT NULL / CHECK constraints
// in database/01_schema.sql and the RLS policies in 02_rls.sql, member1). This
// check only exists so the doctor sees every mistake at once, before the first
// INSERT runs, instead of one failed request per mistake.
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. Collect messages in an errors[] array and return ALL of them, not just
//      the first one: the doctor fixes the whole form in one pass.
//   2. Check in a fixed order (exam header -> questions -> marks total) so the
//      list reads top-to-bottom like the form on screen.
//   3. Treat whitespace-only text as empty (value.trim() === ''), otherwise a
//      row of spaces passes as a title.
//   4. Number the questions from 1 in the messages ("Question 3 needs exactly
//      1 correct option"): the page prints the strings verbatim.
//   5. Never throw. Invalid input is a normal answer, not an exception.
// ============================================================================

/** Every multiple-choice question in this system has exactly 4 options. */
export const MCQ_OPTION_COUNT = 4;

/**
 * Add up the marks of every question in the exam being built.
 *
 * @param {Array<{ marks: number|string }>} questions  rows of form state
 * @returns {number} the total the doctor sees live while typing
 *
 * TODO(Ahmed Fayez, member3 - Milestone M3):
 *   Number(question.marks) || 0 per row. The <input type="number"> hands back
 *   a string while the doctor is typing and '' when the field is cleared, so
 *   the naive reduce() would concatenate "10" + "5" into "105".
 */
export function sumQuestionMarks(questions) {
  void questions;

  throw new Error(
    'sumQuestionMarks() is not implemented yet (Ahmed Fayez - member3, Milestone M3).',
  );
}

/**
 * Validate a whole exam before CreateExam.jsx inserts anything.
 *
 * @param {object} exam
 * @param {string} exam.title                    exams.title
 * @param {string} exam.subjectId                exams.subject_id (chosen from subjects)
 * @param {number|string} exam.durationMinutes   exams.duration_minutes
 * @param {number|string} exam.totalMarks        exams.total_marks
 * @param {Array<{ text: string, marks: number|string,
 *   options: string[], correctIndex: number }>} exam.questions
 * @returns {{ valid: boolean, errors: string[] }} valid === (errors.length === 0)
 *
 * TODO(Ahmed Fayez, member3 - Milestone M3):
 *   1. Required header: title (after trim), subjectId, durationMinutes > 0 and
 *      totalMarks > 0. Compare with Number(...) so "0" and "" both fail.
 *   2. At least one question.
 *   3. Per question: non-empty text, marks > 0, exactly MCQ_OPTION_COUNT
 *      non-empty options, and exactly ONE correct answer whose index points at
 *      a non-empty option (a correct answer on an empty option is not gradeable).
 *   4. Last check: sumQuestionMarks(questions) === Number(totalMarks). The
 *      doctor edits question marks freely, so this is the guard that keeps
 *      exams.total_marks consistent with the questions table. The same rule is
 *      enforced again by the trigger/CHECK in database/01_schema.sql.
 *   5. Return { valid: errors.length === 0, errors }.
 */
export function validateExam(exam) {
  void exam;

  throw new Error(
    'validateExam() is not implemented yet (Ahmed Fayez - member3, Milestone M3).',
  );
}
