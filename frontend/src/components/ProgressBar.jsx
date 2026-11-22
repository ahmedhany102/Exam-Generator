import './ProgressBar.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: components/ProgressBar.jsx
// ----------------------------------------------------------------------------
// One reusable horizontal bar, used in two places:
//   - TakeExam.jsx  : answered questions against the total, e.g. 7 / 10
//   - MyResults.jsx : the score of one attempt against the exam total_marks
// Keeping it a component means the percentage maths is written once, and both
// pages draw the same shape instead of two slightly different bars.
//
// Props:
//   label  - text on the left ("Answered")
//   value  - current number (e.g. 7)
//   max    - highest possible number (default 100, use the question count here)
//   suffix - text after the numbers (default '/ 100')
//   variant- 'success' | 'warning' | 'danger' | 'primary' (controls the colour)
//
// The bar is already implemented because it is pure presentation: it holds no
// state and fetches nothing. The pages that use it are still placeholders.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. Use it in TakeExam.jsx as <ProgressBar label="Answered" value={answered}
//      max={questions.length} suffix={`/ ${questions.length}`} />.
//   2. Use it in MyResults.jsx with max={attempt.exams.total_marks} and
//      variant="success" when the attempt passed, "danger" when it did not.
//   3. Keep the props exactly as they are: other members already import this
//      component, so a rename here would break their pages silently.
// ============================================================================
export default function ProgressBar({
  label,
  value = 0,
  max = 100,
  suffix = '/ 100',
  variant = 'primary',
}) {
  // Guard against bad data: never go below 0 or above 100 %.
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (Number(value) / safeMax) * 100));

  return (
    <div className="progress">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          {value} <span className="progress-suffix">{suffix}</span>
        </span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Number(value)}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div
          className={`progress-fill progress-fill-${variant}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
