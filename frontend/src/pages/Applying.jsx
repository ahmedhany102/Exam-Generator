import { useParams, useLocation } from 'react-router-dom';
import './Applying.css';

// ============================================================================
// Owner: Member 3 - Ahmed Fayez (AI Integration & Applications Dashboard)
// File: pages/Applying.jsx
// Route: /jobs/:jobId/apply   (protected)
// ----------------------------------------------------------------------------
// This is the bridge between the quiz (Member 2) and the database + AI service.
//
// TODO(Member 3 - Milestone M3) - the pipeline, in this order:
//   1. Read the quiz score: const { quizScore } = useLocation().state || {}
//      If it is missing (user refreshed this URL), send them back to the quiz.
//   2. getJobById(jobId) to get required_skills + description (the AI input).
//   3. getProfile() to get cv_url, then downloadCv(cv_url) -> Blob.
//      If cv_url is empty, stop and link to /profile.
//   4. const analysis = await analyzeCv(cvBlob, job)   <- aiService.js
//   5. submitApplication({ jobId, quizScore, aiMatchScore: analysis.match_score,
//        aiStrengths: analysis.strengths, aiWeaknesses: analysis.weaknesses })
//   6. navigate('/applications') and let the dashboard show the result.
//
// UX requirements:
//   - step list (Uploading -> Analysing -> Saving) so the user sees progress
//   - on error: readable message from AI_ERROR_MESSAGES, a Retry button and a
//     hint that the AI service must be running on localhost:8000
//   - never leave the page in a permanent loading state
// ============================================================================
export default function Applying() {
  const { jobId } = useParams();
  const location = useLocation();
  const quizScore = location.state?.quizScore;

  return (
    <section className="applying-page">
      <header className="page-header">
        <h1>Submitting your application</h1>
        <p>
          Placeholder pipeline for job id: <code>{jobId}</code> - quiz score received:{' '}
          <code>{quizScore ?? 'none'}</code>
        </p>
      </header>

      <span className="owner-badge">Owner: Member 3 - Ahmed Fayez</span>

      <div className="card">
        <div className="placeholder-note">
          <strong>Placeholder pipeline (Milestone M0)</strong>
          <p className="applying-todo-title">This page will:</p>
          <ol className="applying-todo-list">
            <li>Download the candidate CV from Supabase Storage</li>
            <li>POST it to the FastAPI /analyze endpoint</li>
            <li>Save the scores and AI feedback in applications</li>
            <li>Redirect to My Applications</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
