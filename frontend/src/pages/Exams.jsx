import './Exams.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/Exams.jsx
// Route: /exams   (student)
// ----------------------------------------------------------------------------
// The student's entry point: every exam that is open right now, searchable and
// filterable by subject. Nothing is fetched per keystroke - the list is loaded
// once and filtered in the browser by utils/filterExams.js, which keeps the page
// fast and the network quiet.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. On mount: getAvailableExams() from services/examsService.js, keep
//      `exams`, `loading` and `error` in useState.
//   2. Load the subject list once for the filter <select> (all subjects = '').
//   3. Controlled search input + subject <select>, both feeding filterExams()
//      through useMemo-free code: one derived array computed at render time.
//   4. Card grid: title, subject name + code, duration via parseDuration(),
//      total_marks, and a status badge from getExamStatus().
//   5. Each card links to /exams/:examId - a <Link> from react-router-dom.
//   6. Three states: <Loader /> while loading, an alert on error, and
//      "No exams match your search." when the filter returns nothing.
// ============================================================================
export default function Exams() {
  return (
    <section className="exams-page">
      <header className="page-header">
        <h1>Available exams</h1>
        <p>
          Every exam that is open for you right now, with its subject, its
          duration and its total marks. Open one to read the rules before you
          start it.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="exams-todo-title">This page will contain:</p>
        <ul className="exams-todo-list">
          <li>A search box and a subject filter, both applied in the browser</li>
          <li>A card grid: title, subject, duration and total marks</li>
          <li>A status badge: open, upcoming or closed</li>
          <li>A link from each card to /exams/:examId</li>
          <li>Loading, error and "no exams match" states</li>
        </ul>
      </div>
    </section>
  );
}
