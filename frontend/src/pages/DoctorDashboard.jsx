import './DoctorDashboard.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/DoctorDashboard.jsx
// Route: /doctor/dashboard   (doctor)
// ----------------------------------------------------------------------------
// The landing page for a doctor: how much am I running, how is it going, and
// what do I do next. Three counters, two shortcuts, one recent list - the
// doctor should never have to hunt through the menu for their own exams.
//
// The page reads this doctor's exams and their attempts directly, derives the
// summary and recent list from those rows, and displays server-generated scores.
// ============================================================================
function toLoadError(error) {
  if (error instanceof Error) return error;
  return new Error(error?.message || 'Could not load your dashboard.');
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExams([]);
    setSubmissions([]);

    async function load() {
      try {
        if (!supabase || !user) {
          throw new Error(!supabase ? 'Supabase is not configured.' : 'You must be signed in.');
        }
        const examResult = await supabase
          .from('exams')
          .select('id, title, created_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (examResult.error) throw examResult.error;

        const ownedExams = examResult.data ?? [];
        setExams(ownedExams);
        if (ownedExams.length === 0) return;

        const examIds = ownedExams.map((exam) => exam.id);
        const attemptsResult = await supabase
          .from('attempts')
          .select('id, exam_id, student_id, score, status, submitted_at, started_at, profiles(full_name, email), exams(title)')
          .in('exam_id', examIds)
          .order('submitted_at', { ascending: false, nullsFirst: false });
        if (cancelled) return;
        if (attemptsResult.error) throw attemptsResult.error;
        setSubmissions(attemptsResult.data ?? []);
      } catch (error) {
        if (!cancelled) setError(toLoadError(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const studentIds = new Set(
    submissions.map((submission) => submission.student_id).filter(Boolean),
  );
  const finished = submissions.filter((submission) => submission.status !== 'in_progress');
  const recent = [...finished]
    .sort((left, right) => new Date(right.submitted_at || 0) - new Date(left.submitted_at || 0))
    .slice(0, 5);

  return (
    <section className="doctor-dashboard-page">
      <header className="page-header">
        <h1>Doctor dashboard</h1>
        <p>
          Everything you run from one place: your exams, the students who sat them and
          the submissions waiting to be looked at.
        </p>
      </header>

      {loading ? (
        <Loader message="Loading your dashboard..." />
      ) : error ? (
        <div className="alert alert-error" role="alert">{error.message}</div>
      ) : (
        <>
          <div className="doctor-dashboard-stats">
            <div className="doctor-stat-card">
              <span className="doctor-stat-value">{exams.length}</span>
              <span className="doctor-stat-label">My exams</span>
            </div>
            <div className="doctor-stat-card">
              <span className="doctor-stat-value">{studentIds.size}</span>
              <span className="doctor-stat-label">Students</span>
            </div>
            <div className="doctor-stat-card">
              <span className="doctor-stat-value">{finished.length}</span>
              <span className="doctor-stat-label">Submissions</span>
            </div>
          </div>

          <div className="doctor-quick-links">
            <Link className="btn" to="/doctor/create-exam">Create exam</Link>
            <Link className="btn btn-secondary" to="/doctor/my-exams">My exams</Link>
          </div>

          {exams.length === 0 ? (
            <div className="doctor-dashboard-empty">
              <p>You have not created an exam yet.</p>
              <Link to="/doctor/create-exam">Create your first exam</Link>
            </div>
          ) : recent.length === 0 ? (
            <div className="doctor-dashboard-empty">
              <p>No submissions have been received yet.</p>
            </div>
          ) : (
            <>
              <h2>Recent submissions</h2>
              <ul className="doctor-recent-list">
                {recent.map((submission) => (
                  <li key={submission.id}>
                    <div>
                      <strong>{submission.profiles?.full_name || submission.profiles?.email || 'Student'}</strong>
                      <span> - {submission.exams?.title || 'Exam'}</span>
                      {submission.score !== null && <span> - Score: {submission.score}</span>}
                    </div>
                    <Link to={`/doctor/exams/${submission.exam_id}/results`}>View results</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
