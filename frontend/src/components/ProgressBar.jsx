import './ProgressBar.css';

// ============================================================================
// Owner: Member 3 - Ahmed Fayez (AI Integration & Applications Dashboard)
// File: components/ProgressBar.jsx
// ----------------------------------------------------------------------------
// One reusable horizontal bar. The "My Applications" page uses three of them
// per application card: AI match score (0-100), quiz score (0-5) and a status
// row. Keeping it in a component means the percentages are calculated once.
//
// Props:
//   label  - text on the left ("AI Match")
//   value  - current number (e.g. 72)
//   max    - highest possible number (default 100, use 5 for the quiz)
//   suffix - text after the numbers (default '/ 100')
//   variant- 'success' | 'warning' | 'danger' | 'primary' (controls the colour)
//
// The bar is already implemented because it is pure presentation and Member 3
// needs it on day one; the pages that use it are still placeholders.
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
