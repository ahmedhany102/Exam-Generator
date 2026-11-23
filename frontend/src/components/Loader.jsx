import { useEffect, useState } from 'react';
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
// Optional delay and layout variants prevent flashes and support inline use.
// Status messaging and reduced-motion styling keep the wait accessible.
// ============================================================================
export default function Loader({ message = 'Loading...', delayMs = 0, variant = 'block' }) {
  const [visible, setVisible] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) {
      setVisible(true);
      return undefined;
    }
    setVisible(false);
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <div
      className={`loader loader--${variant}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="loader-spinner" aria-hidden="true" />
      <span className="loader-text">{message}</span>
    </div>
  );
}
