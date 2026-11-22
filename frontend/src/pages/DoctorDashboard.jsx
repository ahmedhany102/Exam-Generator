import './DoctorDashboard.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/DoctorDashboard.jsx
// Route: /doctor/dashboard   (doctor)
// ----------------------------------------------------------------------------
// The landing page for a doctor: how much am I running, how is it going, and
// what do I do next. Three counters, two shortcuts, one recent list - the
// doctor should never have to hunt through the menu for their own exams.
//
// Dependencies on other members (names are theirs, not mine):
//   resultsService.getExamResultsForDoctor()   - Ibrahim Abduljawad (member4)
//     One row per attempt of one exam. The counters and the "recent
//     submissions" list are both derived from that single call instead of
//     running four separate count queries.
//   services/attemptsService.js (this branch, member3)
//     The status column of those attempts ('in_progress' | 'submitted' |
//     'auto_submitted') is what makes "submissions" differ from "still taking
//     it"; see submitAttempt() there for where the status comes from.
//   services/examsService.js                   - Ibrahim Lotfy (member2)
//     The doctor's own exam list. Confirm his exact function name before M3;
//     if he exposes no doctor-side list, the exam counter is derived from the
//     exam_id values found in the results rows instead.
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. On mount, load the doctor's exams and their results; guard the effect
//      with a `cancelled` flag so a fast unmount cannot setState after leave.
//   2. Counters: my exams (exams created by me), students (distinct
//      student_id across my exams), submissions (attempts whose status is not
//      'in_progress'). Count distinct students with a Set, not rows.
//   3. Quick links: "Create exam" -> /doctor/create-exam and "My exams" ->
//      /doctor/my-exams, so the two main actions are one click from login.
//   4. Recent submissions: the last 5 rows by submitted_at descending, each
//      linking to /doctor/exams/<exam_id>/results (named "View results" and
//      implemented by ExamResults.jsx in this branch).
//   5. States: <Loader message="Loading your dashboard..." /> while the first
//      call is pending, .alert.alert-error on failure, and a calm empty state
//      ("You have not created an exam yet.") for a brand-new doctor account.
//   6. Never compute a score in the browser - read attempts.score, which
//      submit_attempt() in Postgres already wrote.
// ============================================================================
export default function DoctorDashboard() {
  return (
    <section className="doctor-dashboard-page">
      <header className="page-header">
        <h1>Doctor dashboard</h1>
        <p>
          Everything you run from one place: your exams, the students who sat them and
          the submissions waiting to be looked at.
        </p>
      </header>

      <span className="owner-badge">Owner: Ahmed Fayez (member3)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="doctor-dashboard-todo-title">This page will contain:</p>
        <ul className="doctor-dashboard-todo-list">
          <li>Three counters: my exams, students, submissions</li>
          <li>Quick links to create an exam and to manage the existing ones</li>
          <li>A recent submissions list, newest first, linking to the results page</li>
          <li>Loader, error and empty states for a doctor with no exams yet</li>
        </ul>
      </div>
    </section>
  );
}
