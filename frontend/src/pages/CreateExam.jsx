import './CreateExam.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/CreateExam.jsx
// Route: /doctor/create-exam   (doctor)
// ----------------------------------------------------------------------------
// The dynamic exam builder: one exam header plus a list of multiple-choice
// questions that the doctor grows and shrinks while typing. It is the hardest
// page in this branch, so the plan is written down here before the code.
//
// Dependencies:
//   utils/validateExam.js (this branch)  -> validateExam() / sumQuestionMarks()
//   services/examsService.js (Ibrahim Lotfy, member2) -> if he exposes the
//     exam/question/option insert helpers, call those; otherwise insert from
//     here through lib/supabaseClient.js and move the code into a service in
//     M3. Either way the INSERT ORDER below is what matters.
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. Exam state: title, subjectId, description, durationMinutes. Question
//      state is ONE array - useState([emptyQuestion()]) - where each item is
//      { key, text, marks, options: ['', '', '', ''], correctIndex: 0 }.
//      One array instead of one useState per field: a field per question
//      cannot be declared for a list that grows at runtime.
//   2. Give every question a stable `key` (crypto.randomUUID()) and use it as
//      the React key. Using the array index instead makes React reuse the
//      wrong input's DOM when question 2 of 5 is deleted.
//   3. Buttons: "Add question", "Remove question" (keep at least one),
//      "Add option" / "Remove option" bounded by MCQ_OPTION_COUNT, and a radio
//      group per question (name={`correct-${question.key}`}) writing
//      correctIndex. All updates go through the functional setQuestions(prev =>
//      ...) form and never mutate the old array: React only re-renders on a
//      new object.
//   4. Live total marks: totalMarks is DERIVED, not typed - render
//      sumQuestionMarks(questions) in .create-exam-total and send that number
//      as exams.total_marks. Two sources of truth would drift apart.
//   5. On submit, run validateExam({ title, subjectId, durationMinutes,
//      totalMarks, questions }) first; print every error inside
//      .alert.alert-error and stop before the first INSERT.
//   6. INSERT ORDER (Postgres will not give us the ids any other way):
//        a. insert the `exams` row with created_by = auth uid and
//           is_active: true, then .select('id').single() to learn exam_id -
//           the browser cannot invent a uuid.
//        b. insert the `questions` rows in one call, each carrying exam_id,
//           question_text, marks and order_index (array position, from 0),
//           then .select('id, order_index') and sort by order_index so each
//           id maps back to the question the doctor wrote.
//        c. build one flat array of { question_id, option_text, is_correct }
//           from every question (is_correct = optionIndex === correctIndex)
//           and insert it as ONE call: four calls per question would be 4x
//           the round trips.
//        d. navigate('/doctor/my-exams') only after all three inserts
//           succeeded - never on the first one.
//   7. There is no transaction over the REST API, so wrap 6a-6c in try/catch:
//      if the questions or options insert fails after the exam row exists,
//      delete that exam row (the cascade removes the partial rows) and show
//      the error, otherwise the doctor leaves half an exam behind.
//   8. Guard double submits with a `saving` useState flag on the button; a
//      second click would create a second empty exam.
//   9. Subject list: read `subjects` first, then let the doctor pick; a subject
//      with doctor_id = null belongs to the admin-managed catalogue.
// ============================================================================
export default function CreateExam() {
  return (
    <section className="create-exam-page">
      <header className="page-header">
        <h1>Create exam</h1>
        <p>
          Build a multiple-choice exam question by question; the total marks add up as
          you type.
        </p>
      </header>

      <span className="owner-badge">Owner: Ahmed Fayez (member3)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="create-exam-todo-title">This page will contain:</p>
        <ul className="create-exam-todo-list">
          <li>Exam header: title, subject, description, duration in minutes</li>
          <li>A repeatable question block with 4 options and one correct answer</li>
          <li>Add / remove question and add / remove option buttons</li>
          <li>A live total-marks figure and validateExam() errors before saving</li>
          <li>Three chained inserts (exam, questions, options) then a redirect</li>
        </ul>
      </div>
    </section>
  );
}
