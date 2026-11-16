import { useParams } from 'react-router-dom';
import './Quiz.css';

// ============================================================================
// Owner: Member 2 - Ibrahim Lotfy (Jobs Feed & Timed Quiz)
// File: pages/Quiz.jsx
// Route: /jobs/:jobId/quiz   (protected)
// ----------------------------------------------------------------------------
// TODO(Member 2 - Milestone M2):
//   1. getJobById(jobId) -> job.quiz_questions is an array of 5 objects:
//        { question: string, options: string[], correctIndex: number }
//   2. State: currentIndex, answers (array of 5, start with -1), secondsLeft.
//   3. Timer: useEffect with setInterval(1s) counting down from
//      QUIZ_DURATION_SECONDS (utils/scoreQuiz.js). ALWAYS clear it in the
//      effect cleanup, and stop it when the quiz is submitted - otherwise
//      React keeps the interval alive after the page unmounts.
//   4. Auto-submit when secondsLeft reaches 0 (unanswered questions stay -1).
//   5. On submit:
//        const quizScore = scoreQuiz(job.quiz_questions, answers);
//        navigate(`/jobs/${jobId}/apply`, { state: { quizScore } });
//      The score travels in router state (no global store needed).
//   6. Show progress ("Question 3 of 5") and disable Submit until all answered,
//      or keep it enabled and warn about unanswered questions.
// ============================================================================
export default function Quiz() {
  const { jobId } = useParams();

  return (
    <section className="quiz-page">
      <header className="page-header">
        <h1>Quick assessment</h1>
        <p>
          Placeholder quiz for job id: <code>{jobId}</code>
        </p>
      </header>

      <span className="owner-badge">Owner: Member 2 - Ibrahim Lotfy</span>

      <div className="card">
        <div className="placeholder-note">
          <strong>Placeholder quiz (Milestone M0)</strong>
          <p className="quiz-todo-title">This page will contain:</p>
          <ul className="quiz-todo-list">
            <li>Five multiple-choice questions from quiz_questions (JSONB)</li>
            <li>A 5-minute countdown timer</li>
            <li>Question navigation and an answer summary</li>
            <li>scoreQuiz() on submit, then redirect to the apply step</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
