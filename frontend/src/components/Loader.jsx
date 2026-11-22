import './Loader.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: components/Loader.jsx
// ----------------------------------------------------------------------------
// One spinner for every network wait in the system: checking the session
// (App.jsx), loading an exam, and grading a submission. Using one shared
// component keeps the waiting look identical on every page, which matters in
// the demo: the reviewer should never wonder whether a blank area is "loading"
// or "broken".
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. Add a `delayMs` prop (default 0) and render nothing until it elapses, so
//      a request answered from a warm cache does not flash a spinner.
//   2. Add a `variant` prop ('block' default, 'inline') for use inside a table
//      row on ManageExams.jsx and ExamResults.jsx, where a full-height block
//      would push the layout around.
//   3. Keep role="status" + aria-live="polite": a screen reader should hear the
//      message once per state change, not on every rerender.
//   4. Respect prefers-reduced-motion in Loader.css (already done) - the text
//      alone must be enough information.
// ============================================================================
export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <span className="loader-text">{message}</span>
    </div>
  );
}
