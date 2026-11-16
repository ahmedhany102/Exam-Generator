import './Jobs.css';

// ============================================================================
// Owner: Member 2 - Ibrahim Lotfy (Jobs Feed & Timed Quiz)
// File: pages/Jobs.jsx
// Route: /   (protected - this is the home page after login)
// ----------------------------------------------------------------------------
// TODO(Member 2 - Milestone M2):
//   1. On mount: getJobs() and keep them in useState. Show <Loader /> while
//      loading and an .alert-error on failure.
//   2. Search box: <input> bound to state; then
//        const visible = filterJobs(jobs, query);
//      (filtering runs on every keystroke - no button needed, no backend call)
//   3. Render one card per job: title, company, location, skill chips
//      (parseSkills(job.required_skills)), short description preview and a
//      "View details" link to /jobs/:jobId.
//   4. Empty state: "No jobs match your search."
// ============================================================================
export default function Jobs() {
  return (
    <section className="jobs-page">
      <header className="page-header">
        <h1>Open positions</h1>
        <p>Browse open roles, take a quick 5-question quiz and get an AI CV match score.</p>
      </header>

      <span className="owner-badge">Owner: Member 2 - Ibrahim Lotfy</span>

      <div className="placeholder-note">
        <strong>Placeholder feed (Milestone M0)</strong>
        <p className="jobs-todo-title">This page will contain:</p>
        <ul className="jobs-todo-list">
          <li>Job cards loaded from the jobs table</li>
          <li>A search box using filterJobs()</li>
          <li>Skill chips from parseSkills()</li>
          <li>Links to the job details page</li>
        </ul>
      </div>

      <div className="jobs-grid">
        {/* The three dummy cards only demonstrate the grid layout. */}
        <article className="job-card card">
          <h2 className="job-card-title">Job card</h2>
          <p className="job-card-company">Rendered from Supabase in Milestone M2</p>
          <p className="job-card-location">Cairo, Egypt</p>
        </article>
        <article className="job-card card">
          <h2 className="job-card-title">Job card</h2>
          <p className="job-card-company">Rendered from Supabase in Milestone M2</p>
          <p className="job-card-location">Remote</p>
        </article>
        <article className="job-card card">
          <h2 className="job-card-title">Job card</h2>
          <p className="job-card-company">Rendered from Supabase in Milestone M2</p>
          <p className="job-card-location">Alexandria, Egypt</p>
        </article>
      </div>
    </section>
  );
}
