import './MyApplications.css';

// ============================================================================
// Owner: Member 3 - Ahmed Fayez (AI Integration & Applications Dashboard)
// File: pages/MyApplications.jsx
// Route: /applications   (protected)
// ----------------------------------------------------------------------------
// TODO(Member 3 - Milestone M3):
//   1. On mount: getMyApplications() (one query joins jobs(title, company_name)).
//   2. One card per application showing:
//        - job title + company name + submission date
//        - <ProgressBar label="AI Match" value={ai_match_score} variant=... />
//        - <ProgressBar label="Quiz Score" value={quiz_score} max={5} suffix="/ 5" />
//        - strengths list (green ticks) and weaknesses list (red crosses)
//        - status badge ("Submitted")
//   3. Colour rule for the match bar:
//        >= 70 success, 40-69 warning, < 40 danger
//   4. Empty state: "You have not applied for any job yet" + link to /.
//   5. Show a total count ("3 applications").
// ============================================================================
export default function MyApplications() {
  return (
    <section className="applications-page">
      <header className="page-header">
        <h1>My Applications</h1>
        <p>Every submission with its quiz score and the AI CV match analysis.</p>
      </header>

      <span className="owner-badge">Owner: Member 3 - Ahmed Fayez</span>

      <div className="placeholder-note">
        <strong>Placeholder dashboard (Milestone M0)</strong>
        <p className="applications-todo-title">This page will contain:</p>
        <ul className="applications-todo-list">
          <li>Application cards joined with the job title and company</li>
          <li>Two progress bars per card: AI match score and quiz score</li>
          <li>Strengths and weaknesses lists from the Python service</li>
          <li>An empty state with a link back to the jobs feed</li>
        </ul>
      </div>
    </section>
  );
}
