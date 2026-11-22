// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: utils/gradeExam.js
// ----------------------------------------------------------------------------
// The grading rule of the whole system, written once as a pure function: no
// imports, no network, no Supabase client, no React.
//
// Why pure: the doctor's result screen and the offline checks have to compute a
// score without a session, and a pure function is the only form of the rule that
// can be re-run in a check without a database or a JWT.
//
// The rule, identical to database/01_schema.sql -> submit_attempt():
//   score         = sum of questions.marks where the selected option is_correct
//   total         = sum of questions.marks
//   correctCount  = questions answered with the correct option
//   questionCount = questions in the exam
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. Keep this rule in step with submit_attempt() - change both or neither.
//   2. Add the offline checks: 5 questions x 4 options, missing answer, blank
//      answer, an option id that belongs to another question.
//   3. Decide with member1 what a malformed question (no options, or two options
//      flagged correct) should do - today it simply earns nothing extra.
// ============================================================================

/**
 * Marks of one question as a number.
 * A row without a usable positive `marks` is worth 0 instead of throwing, so one
 * bad row cannot break a whole class's results view.
 *
 * @param {{ marks?: number }} question
 * @returns {number}
 */
function marksOf(question) {
  const marks = question.marks;
  return typeof marks === 'number' && Number.isFinite(marks) && marks > 0 ? marks : 0;
}

/**
 * Turn the answer rows into one lookup keyed by question id.
 *
 * Ids are compared as strings because Postgres hands them back as uuid strings
 * while a fresh answer object typed in a check may hold the same value; string
 * comparison is the only form that matches in both cases.
 *
 * @param {Array<{ questionId: string, selectedOptionId: string|null }>} answers
 * @returns {Map<string, string|null|undefined>}
 */
function indexAnswers(answers) {
  const selectedByQuestionId = new Map();
  if (!Array.isArray(answers)) return selectedByQuestionId;

  for (const answer of answers) {
    if (!answer || answer.questionId === null || answer.questionId === undefined) continue;
    selectedByQuestionId.set(String(answer.questionId), answer.selectedOptionId);
  }

  return selectedByQuestionId;
}

/**
 * Grade one exam attempt.
 *
 * A question left unanswered, answered with a blank option, or answered with an
 * option that does not belong to it is simply worth zero - never an exception.
 * A student whose network dropped at question 4 must still get a result.
 *
 * @param {Array<{ id: string, marks: number, options: Array<{ id: string, is_correct: boolean }> }>} questions
 * @param {Array<{ questionId: string, selectedOptionId: string|null }>} answers
 * @returns {{ score: number, total: number, correctCount: number, questionCount: number }}
 */
export function gradeExam(questions, answers) {
  const questionRows = Array.isArray(questions) ? questions.filter(Boolean) : [];
  const selectedByQuestionId = indexAnswers(answers);

  let score = 0;
  let total = 0;
  let correctCount = 0;

  for (const question of questionRows) {
    const marks = marksOf(question);
    total += marks;

    const selectedOptionId = selectedByQuestionId.get(String(question.id));
    if (selectedOptionId === null || selectedOptionId === undefined || selectedOptionId === '') {
      continue;
    }

    const options = Array.isArray(question.options) ? question.options : [];
    const chosen = options.find(
      (option) => option && String(option.id) === String(selectedOptionId),
    );
    if (!chosen) continue;

    if (chosen.is_correct === true) {
      score += marks;
      correctCount += 1;
    }
  }

  return { score, total, correctCount, questionCount: questionRows.length };
}
