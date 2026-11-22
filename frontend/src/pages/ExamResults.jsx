import { useParams } from 'react-router-dom';
import './ExamResults.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/ExamResults.jsx
// Route: /doctor/exams/:examId/results   (doctor)
// ----------------------------------------------------------------------------
// One exam, every student who sat it. The doctor opens this from ManageExams or
// from the dashboard and should see three things within a second: how many
// submitted, the average score, and who failed.
//
// Dependencies on other members:
//   services/resultsService.js  - Ibrahim Abduljawad (member4)
//     getExamResultsForDoctor(examId) owns the query (attempts joined with the
//     student's profile row). The doctor may not read `options.is_correct`, and
//     the student name comes from `profiles`, so that join belongs in his
//     service and not in this page.
//   services/attemptsService.js (this branch) -> the status vocabulary used
//     below ('in_progress' | 'submitted' | 'auto_submitted') and the score
//     written by submit_attempt().
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. useParams() -> examId; load once on mount with
//      resultsService.getExamResultsForDoctor(examId), guarded by a `cancelled`
//      flag so a fast "back" click cannot setState after unmount.
//   2. Table: student full name, started_at, submitted_at, score / total,
//      status. Format the two timestamps with toLocaleString() and remember
//      they are stored in UTC: say "Cairo time" in the column header if the
//      demo is shown on a machine in another zone.
//   3. Sort by score descending, with the 'in_progress' rows (score null) last:
//      a running attempt has no score yet and would otherwise sort on top.
//   4. Summary: count, average score and pass rate. Average only over finished
//      attempts (score !== null), otherwise a running attempt drags it down.
//      There is no pass-mark column in database/01_schema.sql, so keep the
//      threshold as a named constant here (PASS_PERCENTAGE = 50) and mention
//      that in the defence instead of hard-coding 0.5 in the JSX.
//   5. Status badges: 'submitted' green, 'auto_submitted' warning ("time ran
//      out"), 'in_progress' muted. Reuse .exam-results-badge modifiers.
//   6. Empty state: "No student has sat this exam yet." plus a link back to
//      /doctor/my-exams. Loader while the first call is pending, and
//      error.message in .alert.alert-error when it fails.
//   7. Never recompute a score from the answers in the browser: options.is_correct
//      is hidden from this role by RLS, and attempts.score is the graded truth.
// ============================================================================
export default function ExamResults() {
  // The route parameter is the only input of this page; keeping it here means
  // the loading effect can be re-run for a different exam without a remount.
  const { examId } = useParams();

  return (
    <section className="exam-results-page">
      <header className="page-header">
        <h1>Exam results</h1>
        <p>
          Every attempt on this exam, sorted by score, with the average and the pass rate.
        </p>
      </header>

      <span className="owner-badge">Owner: Ahmed Fayez (member3)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="exam-results-todo-title">
          This page will contain ({examId ? `exam ${examId}` : 'no exam selected'}):
        </p>
        <ul className="exam-results-todo-list">
          <li>All attempts on one exam: student name, started, submitted</li>
          <li>Score and total per student, sorted by score descending</li>
          <li>A status badge: submitted, auto submitted or in progress</li>
          <li>Average score and pass rate above the table</li>
        </ul>
      </div>
    </section>
  );
}
