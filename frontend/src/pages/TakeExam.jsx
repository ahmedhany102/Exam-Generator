import './TakeExam.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/TakeExam.jsx
// Route: /exams/:examId/take   (student)
// ----------------------------------------------------------------------------
// The timed exam screen. This is the file with the real engineering in it, so the
// TODO list below is written as decisions, not as a wish list: each item says why
// the obvious way is wrong.
//
// Cross-owner dependency (do not work around it):
//   attemptsService.getOpenAttempt() and attemptsService.submitAttempt() belong to
//   Ahmed Fayez (member3). They still throw "not implemented" in M0, so every call
//   below is wrapped in try/catch and a throw is shown as an alert, never as a
//   blank page.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. Load getExamById(examId) + getExamQuestionsWithoutAnswers(examId) together
//      in one useEffect with a `cancelled` flag, so a slow response cannot write
//      state into an unmounted page.
//   2. Attempt lifecycle: getOpenAttempt(examId) first, create the attempt row
//      when there is none (ask Ahmed Fayez, member3, for the exact create/find
//      name before writing the call - only getOpenAttempt and submitAttempt are
//      fixed by the contract), and refuse the page when the attempt is already
//      submitted: unique(exam_id, student_id) makes one attempt the database rule.
//   3. Resume after a refresh: remainingSeconds is
//      duration_minutes * 60 - (Date.now() - new Date(attempt.started_at)) / 1000.
//      The deadline comes from the SERVER row, not from a fresh countdown,
//      because F5 must not hand the student a second full duration. Clamp to 0
//      for an expired attempt, which then submits immediately.
//   4. Timer: one setInterval(1000) inside a useEffect that owns it, and the
//      returned cleanup function calls clearInterval. Without the cleanup every
//      re-render or navigation leaves another interval ticking and decrementing
//      state forever - that leak is a standard code-review question.
//   5. Auto-submit once at 0: a `submitting` useState flag guards it, so the
//      interval and the button cannot both fire. Do not use useRef - this project
//      allows useState/useEffect only.
//   6. Answers: one useState object keyed by question id holding
//      selected_option_id. Only the option id is kept, never is_correct, because
//      that column is never sent to the browser (see examsService.js).
//   7. <ProgressBar label="Answered" value={answeredCount}
//      max={questions.length} suffix={`/ ${questions.length}`} /> from
//      components/ProgressBar.jsx.
//   8. Submit: await submitAttempt(attempt.id, answers) -> navigate('/my-results',
//      { replace: true }). replace matters: the back button must not return to a
//      finished timed exam.
//   9. Show the timer as mm:ss and turn it warning-coloured under 60 seconds;
//      show an alert when the questions list is empty instead of an empty form.
// ============================================================================
export default function TakeExam() {
  return (
    <section className="take-exam-page">
      <header className="page-header">
        <h1>Take exam</h1>
        <p>
          Answer every question you can, then submit. The countdown starts from
          the moment the attempt was created, so reloading the page does not give
          you extra time.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="take-exam-todo-title">This page will contain:</p>
        <ul className="take-exam-todo-list">
          <li>A countdown in mm:ss, driven by one setInterval with a cleanup</li>
          <li>Remaining time rebuilt from attempts.started_at after a refresh</li>
          <li>One question at a time with its options as full-width rows</li>
          <li>A progress bar of answered questions against the total</li>
          <li>Auto-submit when the countdown reaches zero, and a manual submit</li>
        </ul>
      </div>
    </section>
  );
}
