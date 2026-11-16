import { useParams } from 'react-router-dom';
import './JobDetails.css';

// ============================================================================
// Owner: Member 2 - Ibrahim Lotfy (Jobs Feed & Timed Quiz)
// File: pages/JobDetails.jsx
// Route: /jobs/:jobId   (protected)
// ----------------------------------------------------------------------------
// TODO(Member 2 - Milestone M2):
//   1. const { jobId } = useParams();  (already wired below)
//   2. getJobById(jobId) -> title, company, location, description, skills.
//   3. Show parseSkills(job.required_skills) as chips.
//   4. "Apply now" button logic:
//        - no CV on the profile -> send the user to /profile first
//          (getProfile() from Member 1; cv_url must not be empty)
//        - already applied -> hasApplied(jobId) (Member 3) -> disabled button
//          "Already applied"
//        - otherwise -> navigate(`/jobs/${jobId}/quiz`)
//   5. Handle "job not found" (getJobById returns null/PGRST116) with a
//      friendly message instead of a crash.
// ============================================================================
export default function JobDetails() {
  const { jobId } = useParams();

  return (
    <section className="job-details-page">
      <header className="page-header">
        <h1>Job details</h1>
        <p>
          Placeholder for job id: <code>{jobId}</code>
        </p>
      </header>

      <span className="owner-badge">Owner: Member 2 - Ibrahim Lotfy</span>

      <div className="card">
        <div className="placeholder-note">
          <strong>Placeholder page (Milestone M0)</strong>
          <p className="job-details-todo-title">This page will contain:</p>
          <ul className="job-details-todo-list">
            <li>Title, company name and location</li>
            <li>Full job description</li>
            <li>Required skills as chips</li>
            <li>An Apply button with the three guards described in the header comment</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
