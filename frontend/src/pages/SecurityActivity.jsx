import './SecurityActivity.css';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: pages/SecurityActivity.jsx
// Route: /security   (any signed-in role)
// ----------------------------------------------------------------------------
// The page that makes RLS and audit logging visible to the examiner: every
// sign-in attempt, every exam submission and every blocked action lands in
// security_logs, and each user only ever sees their own rows.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. On mount: getMySecurityLogs() from securityLogService (Ahmed Hany,
//      member1) -> rows already ordered newest first by the service.
//   2. Render a semantic <table> with: date/time, event, details.
//   3. Colour the event badge by kind:
//        LOGIN_SUCCESS / EXAM_SUBMITTED              -> green
//        LOGIN_FAILED / BLOCKED_ACTION               -> red
//        LOGOUT / EXAM_STARTED                       -> neutral
//   4. Empty state: "No security activity yet. Try signing in."
//   5. One sentence above the table explaining that RLS - not this page -
//      limits the rows to the signed-in user's email.
// ============================================================================
export default function SecurityActivity() {
  return (
    <section className="security-page">
      <header className="page-header">
        <h1>Security activity</h1>
        <p>
          Every sign-in attempt, exam start, exam submission and blocked action is recorded in
          the <code>security_logs</code> table. Row Level Security means you only ever see your
          own events.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Abduljawad (member4)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="security-todo-title">This page will contain:</p>
        <ul className="security-todo-list">
          <li>A table of your own LOGIN_SUCCESS and LOGIN_FAILED rows</li>
          <li>EXAM_STARTED, EXAM_SUBMITTED and BLOCKED_ACTION events</li>
          <li>Colour-coded badges per event type</li>
          <li>An empty state for a brand-new account</li>
        </ul>
      </div>
    </section>
  );
}
