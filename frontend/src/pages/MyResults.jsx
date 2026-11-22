import './MyResults.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/MyResults.jsx
// Route: /my-results   (student)
// ----------------------------------------------------------------------------
// The list of attempts this student has finished, newest first. One row per
// attempt: which exam, when it was submitted, the score against the exam total,
// and whether it counts as a pass.
//
// Cross-owner dependency (do not work around it):
//   resultsService.getMyResults() belongs to Ibrahim Abduljawad (member4) and
//   still throws "not implemented" in M0, so the call is wrapped in try/catch and
//   a throw is shown as an alert rather than as a crash.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. On mount: getMyResults() -> attempts joined with the exam title and
//      total_marks; keep `results`, `loading`, `error` in useState.
//   2. Render newest first (order by submitted_at desc in the service, not here).
//   3. Per row: exam title, submitted_at formatted with toLocaleString(), and
//      "score / total_marks" - the total comes from the exam, never a constant.
//   4. Pass badge: passed = score * 2 >= total_marks, i.e. score >= 50 % of the
//      total. Written as a multiplication so 50 % of an odd total stays exact and
//      no rounded percentage can flip the badge.
//   5. Feed the same number to <ProgressBar max={total_marks} /> with
//      variant="success" or "danger" - one bar, one meaning.
//   6. Empty state: "You have not taken an exam yet." plus a <Link to="/exams">,
//      because a dead end on a dashboard is worse than no page at all.
//   7. Do not show questions or the correct answers here: the score is the whole
//      result a student is allowed to read.
// ============================================================================
export default function MyResults() {
  return (
    <section className="my-results-page">
      <header className="page-header">
        <h1>My results</h1>
        <p>
          Every attempt you have submitted, with the score you earned out of the
          exam total. An exam counts as passed from half of its marks.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="my-results-todo-title">This page will contain:</p>
        <ul className="my-results-todo-list">
          <li>One row per submitted attempt, newest first</li>
          <li>Exam title, submission date and score / total marks</li>
          <li>A pass or fail badge computed from the exam total</li>
          <li>An empty state linking to /exams</li>
          <li>Loading and error states, so a failed request is never a blank page</li>
        </ul>
      </div>
    </section>
  );
}
