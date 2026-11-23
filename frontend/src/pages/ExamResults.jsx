import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import './ExamResults.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/ExamResults.jsx
// Route: /doctor/exams/:examId/results   (doctor)
// ----------------------------------------------------------------------------
// One exam, every student who sat it. The doctor opens this from ManageExams or
// from the dashboard and should see three things within a second: how many
// submitted, the average score, and who failed.
//
// The page scopes results to an exam owned by the signed-in doctor and displays
// the stored score; grading remains server-side.
// ============================================================================
const PASS_PERCENTAGE = 50;

function toLoadError(error, fallback) {
  if (error instanceof Error) return error;
  return new Error(error?.message || fallback);
}

export default function ExamResults() {
  // The route parameter is the only input of this page; keeping it here means
  // the loading effect can be re-run for a different exam without a remount.
  const { examId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExam(null);
    setAttempts([]);

    async function load() {
      try {
        if (!supabase || !user) {
          throw new Error(!supabase ? 'Supabase is not configured.' : 'You must be signed in.');
        }
        if (!examId) throw new Error('No exam was selected.');

        const examResult = await supabase
          .from('exams')
          .select('id, title, total_marks, created_by')
          .eq('id', examId)
          .eq('created_by', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (examResult.error) throw examResult.error;
        if (!examResult.data) throw new Error('Exam not found or you do not own this exam.');

        const attemptsResult = await supabase
          .from('attempts')
          .select('id, student_id, started_at, submitted_at, score, status, profiles(full_name, email)')
          .eq('exam_id', examId)
          .order('score', { ascending: false, nullsFirst: false });
        if (cancelled) return;
        if (attemptsResult.error) throw attemptsResult.error;

        setExam(examResult.data);
        setAttempts(attemptsResult.data ?? []);
      } catch (error) {
        if (!cancelled) setError(toLoadError(error, 'Could not load exam results.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [examId, user]);

  const sortedAttempts = [...attempts].sort((left, right) => {
    if (left.score === null && right.score !== null) return 1;
    if (left.score !== null && right.score === null) return -1;
    return (right.score ?? 0) - (left.score ?? 0);
  });
  const total = Number(exam?.total_marks ?? 0);
  const finished = sortedAttempts.filter((attempt) => (
    (attempt.status === 'submitted' || attempt.status === 'auto_submitted')
    && attempt.score !== null
    && Number.isInteger(Number(attempt.score))
    && Number(attempt.score) >= 0
    && total > 0
    && Number(attempt.score) <= total
  ));
  const average = finished.length
    ? finished.reduce((sum, attempt) => sum + Number(attempt.score ?? 0), 0) / finished.length
    : 0;
  const getPercentage = (score) => (
    total > 0 && score !== null && Number.isFinite(Number(score))
      ? Math.round((Number(score) / total) * 100)
      : null
  );
  const passing = finished.filter((attempt) => (
    getPercentage(attempt.score) >= PASS_PERCENTAGE
  )).length;
  const passRate = finished.length ? Math.round((passing / finished.length) * 100) : 0;

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  }

  function statusBadge(status) {
    if (status === 'submitted') return ['Submitted', 'submitted'];
    if (status === 'auto_submitted') return ['Time ran out', 'auto'];
    return ['In progress', 'running'];
  }

  return (
    <section className="exam-results-page">
      <header className="page-header">
        <h1>Exam results</h1>
        <p>
          Every attempt on this exam, sorted by score, with the average and the pass rate.
        </p>
      </header>

      {loading ? (
        <Loader message="Loading exam results..." />
      ) : error ? (
        <div className="alert alert-error" role="alert">{error.message}</div>
      ) : (
        <>
          <div className="exam-results-summary">
            <div className="exam-results-stat">
              <span className="exam-results-stat-value">{finished.length}</span>
              <span className="exam-results-stat-label">Submissions</span>
            </div>
            <div className="exam-results-stat">
              <span className="exam-results-stat-value">{average.toFixed(1)}</span>
              <span className="exam-results-stat-label">Average score</span>
            </div>
            <div className="exam-results-stat">
              <span className="exam-results-stat-value">{passRate}%</span>
              <span className="exam-results-stat-label">Pass rate</span>
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="exam-results-empty">
              <p>No student has sat this exam yet.</p>
              <Link to="/doctor/my-exams">Back to my exams</Link>
            </div>
          ) : (
            <div className="exam-results-table-wrapper">
              <table className="exam-results-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Started (local time)</th>
                    <th>Submitted (local time)</th>
                    <th className="exam-results-score">Score</th>
                    <th className="exam-results-score">Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttempts.map((attempt) => {
                    const [label, modifier] = statusBadge(attempt.status);
                    const score = attempt.score;
                    const percentage = getPercentage(score);
                    return (
                      <tr key={attempt.id}>
                        <td>{attempt.profiles?.full_name || 'Student'}</td>
                        <td>{attempt.profiles?.email || '-'}</td>
                        <td>{formatDate(attempt.started_at)}</td>
                        <td>{formatDate(attempt.submitted_at)}</td>
                        <td className="exam-results-score">
                          {score === null ? '-' : `${score} / ${total}`}
                        </td>
                        <td className={`exam-results-score${percentage !== null && percentage < PASS_PERCENTAGE ? ' exam-results-score--low' : ''}`}>
                          {percentage === null ? '-' : `${percentage}%`}
                        </td>
                        <td>
                          <span className={`exam-results-badge exam-results-badge--${modifier}`}>{label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="exam-results-note">
            Passing is based on a rounded percentage of at least {PASS_PERCENTAGE}%.{' '}
            <Link to="/doctor/my-exams">Back to my exams</Link>
          </p>
        </>
      )}
    </section>
  );
}
