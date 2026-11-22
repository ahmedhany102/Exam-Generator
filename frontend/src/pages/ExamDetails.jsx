import './ExamDetails.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/ExamDetails.jsx
// Route: /exams/:examId   (student)
// ----------------------------------------------------------------------------
// The read-before-you-start screen: what the exam is, how long it lasts, how it
// is marked, and the one rule that matters - a student sits an exam once. The
// "Start exam" button is therefore not always enabled: it depends on whether an
// attempt row already exists for this pair of exam and student.
//
// Cross-owner dependency (do not work around it):
//   attemptsService.getOpenAttempt(examId) belongs to Ahmed Fayez (member3) and
//   still throws the "not implemented" error in M0. The call must be wrapped in
//   try/catch and a throw treated as "no attempt yet", otherwise member3's
//   unfinished file would block this whole page during the demo.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. const { examId } = useParams(); load getExamById(examId) in a useEffect
//      and render a "Exam not found" card when data is null or error is set.
//   2. Show subject name + code, duration via parseDuration(), total_marks,
//      start_time..end_time and the status badge from getExamStatus().
//   3. Rules panel: duration, total marks, one attempt only, answers are saved
//      as they are chosen, and the exam submits itself when the timer reaches 0.
//   4. Ask attemptsService.getOpenAttempt(examId) inside try/catch and store the
//      result; on throw keep `attempt = null` and comment why.
//   5. Button: "Start exam" -> navigate(`/exams/${examId}/take`). When an attempt
//      already exists the label becomes "Resume exam" (in_progress) or
//      "Already attempted" (submitted / auto_submitted), and the last one is
//      disabled - the database's unique(exam_id, student_id) is the real guard.
//   6. Never render an answer key here: options are not loaded on this page.
// ============================================================================
export default function ExamDetails() {
  return (
    <section className="exam-details-page">
      <header className="page-header">
        <h1>Exam details</h1>
        <p>
          Read the rules first, then start. Once the exam is open you have the
          full duration on the clock, and it is submitted for you when the time
          runs out.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="exam-details-todo-title">This page will contain:</p>
        <ul className="exam-details-todo-list">
          <li>Exam title, subject name and subject code</li>
          <li>Duration, total marks and the open/closed time window</li>
          <li>A rules panel: one attempt only, auto-submit at zero</li>
          <li>A "Start exam" button linking to /exams/:examId/take</li>
          <li>
            A check for an existing attempt, so a second start is refused instead
            of creating a second row
          </li>
        </ul>
      </div>
    </section>
  );
}
