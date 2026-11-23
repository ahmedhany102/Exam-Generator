import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { getMyResults } from '../services/resultsService.js';
import './MyResults.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/MyResults.jsx
// Route: /my-results   (student)
// ----------------------------------------------------------------------------
// The list of attempts this student has finished, newest first. One row per
// attempt: which exam, when it was submitted, the score against the exam total,
// and whether it counts as a pass.
// ============================================================================
export default function MyResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await getMyResults();
        if (cancelled) return;

        if (err) {
          setError(err.message || 'Failed to load results');
        } else {
          setResults(data || []);
        }
      } catch (serviceErr) {
        // Cross-owner dependency: resultsService.getMyResults() belongs to
        // Ibrahim Abduljawad (member4). While it may throw in M0/M2, we catch
        // and fall back to querying attempts directly if supabase is configured,
        // or show the error gracefully.
        console.warn('resultsService.getMyResults threw (waiting for member4):', serviceErr);

        if (supabase) {
          try {
            const { data: directAttempts, error: directErr } = await supabase
              .from('attempts')
              .select('*, exams(title, total_marks, subjects(name))')
              .in('status', ['submitted', 'auto_submitted'])
              .order('submitted_at', { ascending: false });

            if (!cancelled) {
              if (directErr) {
                setError(directErr.message);
              } else {
                setResults(directAttempts || []);
              }
            }
          } catch (directCatchErr) {
            if (!cancelled) {
              setError(directCatchErr.message || 'Results currently unavailable');
            }
          }
        } else if (!cancelled) {
          setError(serviceErr.message || 'Results service not implemented yet');
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="my-results-page">
      <header className="page-header">
        <h1>My results</h1>
        <p>
          Every attempt you have submitted, with the score you earned out of the
          exam total. An exam counts as passed from half of its marks.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      {loading && <Loader message="Loading your exam results..." />}

      {error && !loading && (
        <div
          className="alert alert-error"
          role="alert"
          style={{ marginBottom: 'var(--space-md)' }}
        >
          {error}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="alert alert-info" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <p style={{ marginBottom: 'var(--space-md)', fontSize: '1.05rem' }}>
            You have not taken an exam yet.
          </p>
          <Link to="/exams" className="btn btn-primary">
            Browse available exams
          </Link>
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className="results-list">
          {results.map((attempt) => {
            const totalMarks = attempt.exams?.total_marks || 0;
            const score = attempt.score ?? 0;
            const passed = score * 2 >= totalMarks;
            const submissionDate = attempt.submitted_at
              ? new Date(attempt.submitted_at).toLocaleString()
              : 'Unknown date';

            return (
              <li key={attempt.id} className="result-row">
                <div style={{ flex: '1 1 250px' }}>
                  <div className="result-exam-title">
                    {attempt.exams?.title || 'Exam'}
                  </div>
                  {attempt.exams?.subjects?.name && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {attempt.exams.subjects.name}
                    </div>
                  )}
                  <time className="result-date">{submissionDate}</time>
                </div>

                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <ProgressBar
                    label="Score"
                    value={score}
                    max={totalMarks || 1}
                    suffix={`/ ${totalMarks}`}
                    variant={passed ? 'success' : 'danger'}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                  }}
                >
                  <div className="result-score">
                    {score} <span className="result-score-total">/ {totalMarks}</span>
                  </div>
                  <span
                    className={`result-badge ${
                      passed ? 'result-badge--pass' : 'result-badge--fail'
                    }`}
                  >
                    {passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
