// ============================================================================
// Owner: Member 2 - Ibrahim Lotfy (Jobs Feed & Timed Quiz)
// File: utils/scoreQuiz.js
// ----------------------------------------------------------------------------
// Pure function: turns the candidate's answers into a score out of 5.
// The score is calculated in the browser (as the project requires) and then
// stored in applications.quiz_score by Member 3.
//
// Known limitation to mention in the security report: because the score is
// computed on the client, a determined user could tamper with it. The proper
// fix is a server-side check (an Edge Function or a Postgres function), which
// is listed as future work in PLAN.md.
// ============================================================================

/**
 * @param {object[]} questions  job.quiz_questions, 5 objects:
 *                              { question, options: string[], correctIndex }
 * @param {number[]} answers    answers[i] is the option index the candidate
 *                              picked for questions[i]; -1 or undefined when
 *                              the question was left empty
 * @returns {number} number of correct answers (0..questions.length)
 *
 * TODO(Member 2 - Milestone M2):
 *   let score = 0;
 *   questions.forEach((q, i) => { if (answers[i] === q.correctIndex) score += 1; });
 *   return score;
 */
export function scoreQuiz(questions, answers) {
  void questions;
  void answers;
  throw new Error('scoreQuiz() is not implemented yet (Member 2 - Ibrahim Lotfy, M2).');
}

/** Quiz duration in seconds (5 minutes) - the timer in Quiz.jsx counts this down. */
export const QUIZ_DURATION_SECONDS = 5 * 60;
