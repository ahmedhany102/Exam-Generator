import './ManageExams.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/ManageExams.jsx
// Route: /doctor/my-exams   (doctor)
// ----------------------------------------------------------------------------
// The doctor's own exam list: one table row per exam, one place to open its
// results or remove it. This page is where CreateExam.jsx lands after saving,
// so the newest exam must be visible at the top of the table.
//
// Dependencies on other members (names are theirs, not mine):
//   services/examsService.js          - Ibrahim Lotfy (member2)
//     The doctor-side list and delete. Confirm his exact function names before
//     M3 (getMyExams / createExam / deleteExam are the names assumed here); if
//     his branch does not expose them, add the queries to this page in M3 and
//     tell him, do not edit his file.
//   database/01_schema.sql            - Ahmed Hany (member1)
//     The ON DELETE CASCADE rules that make the delete button a single
//     statement; the RLS policies that only let the owner doctor delete.
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. On mount, load my exams (created_by = my uid) newest first, with the
//      subject name; re-run the load after a delete instead of mutating the
//      local array by hand.
//   2. Question count per exam: ask for the nested relation
//      .select('*, subjects(name), questions(id)') and use questions.length.
//      One query beats N queries inside a .map().
//   3. Columns: title, subject, duration (minutes), total marks, status
//      (is_active -> "Active" / "Inactive"), question count, actions.
//   4. Actions: "View results" -> /doctor/exams/<exam.id>/results (implemented
//      by ExamResults.jsx in this branch) and "Delete".
//   5. Delete: ask once with window.confirm naming the exam, then delete the
//      `exams` row. The cascade in 01_schema.sql removes its questions, its
//      options, its attempts and their answers in the same statement - write
//      that in the confirmation text so nobody destroys grades by accident.
//   6. Prefer is_active = false instead of DELETE once an exam has attempts:
//      deleting destroys the students' scores, hiding it does not. Offer both.
//   7. Handle a refused delete (a doctor who is not the owner, blocked by RLS)
//      by printing error.message in .alert.alert-error and leaving the row.
//   8. States: <Loader message="Loading your exams..." /> on the first load and
//      an empty state pointing at /doctor/create-exam when the list is empty.
// ============================================================================
export default function ManageExams() {
  return (
    <section className="manage-exams-page">
      <header className="page-header">
        <h1>My exams</h1>
        <p>
          Every exam you created, with the number of questions and a shortcut to its
          results.
        </p>
      </header>

      <span className="owner-badge">Owner: Ahmed Fayez (member3)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="manage-exams-todo-title">This page will contain:</p>
        <ul className="manage-exams-todo-list">
          <li>A table of my exams: subject, duration, marks, status, questions</li>
          <li>A link per row to the results of that exam</li>
          <li>A delete action that cascades questions, options and attempts</li>
          <li>Loader, empty and error states</li>
        </ul>
      </div>
    </section>
  );
}
