import './SecurityActivity.css';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: pages/SecurityActivity.jsx
// Route: /security   (protected)
// ----------------------------------------------------------------------------
// The page that makes RLS and audit logging visible to the examiner.
//
// TODO(Member 1 - Milestone M1):
//   1. On mount: getMySecurityLogs() -> rows ordered newest first.
//   2. Render a semantic <table> with: Date/time, Event, Details.
//   3. Colour-code the event type with a small badge:
//        LOGIN_SUCCESS / CV_UPLOADED      -> green
//        LOGIN_FAILED  / INVALID_FILE_BLOCKED -> red
//   4. Empty state: "No security activity yet. Try logging in."
//   5. Add one sentence above the table explaining that RLS limits these rows
//      to the current user's email - say this out loud during the defence.
// ============================================================================
export default function SecurityActivity() {
  return (
    <section className="security-page">
      <header className="page-header">
        <h1>Security Activity</h1>
        <p>
          Every login attempt, CV upload and blocked file is recorded in the
          <code> security_logs </code> table. Row Level Security means you only ever see
          your own events.
        </p>
      </header>

      <span className="owner-badge">Owner: Member 1 - Ahmed Hany</span>

      <div className="placeholder-note">
        <strong>Placeholder table (Milestone M0)</strong>
        <p className="security-todo-title">This page will contain:</p>
        <ul className="security-todo-list">
          <li>A table of your own LOGIN_SUCCESS / LOGIN_FAILED rows</li>
          <li>CV_UPLOADED and INVALID_FILE_BLOCKED events</li>
          <li>Colour-coded badges per event type</li>
          <li>An empty state for new accounts</li>
        </ul>
      </div>
    </section>
  );
}
