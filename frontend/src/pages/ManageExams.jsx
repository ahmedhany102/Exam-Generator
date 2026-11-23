import './ManageExams.css';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';

function toOperationError(error, fallback) {
  if (error instanceof Error) return error;
  return new Error(error?.message || fallback);
}

async function fetchOwnedExams(userId) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!userId) throw new Error('You must be signed in.');

  const { data, error } = await supabase
    .from('exams')
    .select('*, subjects(name, code), questions(id), attempts(id)')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/ManageExams.jsx
// Route: /doctor/my-exams   (doctor)
// ----------------------------------------------------------------------------
// The doctor's own exam list: one table row per exam, one place to open its
// results or remove it. This page is where CreateExam.jsx lands after saving,
// so the newest exam must be visible at the top of the table.
//
// Dependencies on other members (names are theirs, not mine):
//   services/examsService.js          - Ibrahim Lotfy (member2)
//     The doctor-side list and delete. Confirm his exact function names before
//     M3 (getMyExams / createExam / deleteExam are the names assumed here); if
//     his branch does not expose them, add the queries to this page in M3 and
//     tell him, do not edit his file.
//   database/01_schema.sql            - Ahmed Hany (member1)
//     The ON DELETE CASCADE rules that make the delete button a single
//     statement; the RLS policies that only let the owner doctor delete.
//
// Implementation notes:
//   1. On mount, load my exams (created_by = my uid) newest first, with the
//      subject name; re-run the load after a delete instead of mutating the
//      local array by hand.
//   2. Question count per exam: ask for the nested relation
//      .select('*, subjects(name), questions(id)') and use questions.length.
//      One query beats N queries inside a .map().
//   3. Columns include the exam window in local time as well as status,
//      question count and row actions.
//   4. Actions: "View results" -> /doctor/exams/<exam.id>/results (implemented
//      by ExamResults.jsx in this branch) and "Delete".
//   5. Delete: ask once with window.confirm naming the exam, then delete the
//      `exams` row. The cascade in 01_schema.sql removes its questions, its
//      options, its attempts and their answers in the same statement - write
//      that in the confirmation text so nobody destroys grades by accident.
//   6. Prefer is_active = false instead of DELETE once an exam has attempts:
//      deleting destroys the students' scores, hiding it does not. Offer both.
//   7. Handle a refused delete (a doctor who is not the owner, blocked by RLS)
//      by printing error.message in .alert.alert-error and leaving the row.
//   8. States: <Loader message="Loading your exams..." /> on the first load and
//      an empty state pointing at /doctor/create-exam when the list is empty.
// ============================================================================
export default function ManageExams() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mountedRef = useRef(false);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState('');
  const actionInProgressRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const routeNotice = location.state?.notice;
    if (!routeNotice) return;
    setNotice(routeNotice);
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location, navigate]);

  async function loadExams() {
    if (!mountedRef.current) return false;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOwnedExams(user?.id);
      if (!mountedRef.current) return false;
      setExams(data);
      return true;
    } catch (error) {
      if (mountedRef.current) setError(toOperationError(error, 'Could not load your exams.'));
      return false;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExams([]);

    async function load() {
      try {
        const data = await fetchOwnedExams(user?.id);
        if (!cancelled) setExams(data);
      } catch (error) {
        if (!cancelled) setError(toOperationError(error, 'Could not load your exams.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  async function handleDelete(exam) {
    if (actionInProgressRef.current) return;
    const confirmed = window.confirm(
      `Delete "${exam.title}"? This permanently removes its questions, options, attempts and answers. Continue?`,
    );
    if (!confirmed) return;
    actionInProgressRef.current = exam.id;
    setDeletingId(exam.id);
    setError(null);
    try {
      if (!supabase || !user) throw new Error('You must be signed in to delete an exam.');
      const { data, error: deleteError } = await supabase
        .from('exams')
        .delete()
        .eq('id', exam.id)
        .eq('created_by', user.id)
        .select('id')
        .maybeSingle();
      if (deleteError) throw deleteError;
      if (!data) {
        throw new Error('The exam was not deleted. It may have attempts or may no longer be available.');
      }
      if (mountedRef.current) {
        setExams((current) => current.filter((item) => item.id !== exam.id));
      }
      await loadExams();
    } catch (error) {
      if (mountedRef.current) setError(toOperationError(error, 'Could not delete the exam.'));
    } finally {
      if (mountedRef.current) setDeletingId(null);
      actionInProgressRef.current = null;
    }
  }

  async function handleDeactivate(exam) {
    if (actionInProgressRef.current) return;
    if (!window.confirm(`Hide "${exam.title}" without deleting its student results?`)) return;
    actionInProgressRef.current = exam.id;
    setDeletingId(exam.id);
    setError(null);
    try {
      if (!supabase || !user) throw new Error('You must be signed in to hide an exam.');
      const { data, error: updateError } = await supabase
        .from('exams')
        .update({ is_active: false })
        .eq('id', exam.id)
        .eq('created_by', user.id)
        .select('id, is_active')
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data || data.is_active !== false) {
        throw new Error('The exam could not be confirmed as hidden.');
      }
      if (mountedRef.current) {
        setExams((current) => current.map((item) => (
          item.id === exam.id ? { ...item, is_active: false } : item
        )));
      }
      await loadExams();
    } catch (error) {
      if (mountedRef.current) setError(toOperationError(error, 'Could not hide the exam.'));
    } finally {
      if (mountedRef.current) setDeletingId(null);
      actionInProgressRef.current = null;
    }
  }

  function formatDateTime(value, fallback) {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString();
  }

  return (
    <section className="manage-exams-page">
      <header className="page-header">
        <h1>My exams</h1>
        <p>
          Every exam you created, with the number of questions and a shortcut to its
          results.
        </p>
      </header>

      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {error && <div className="alert alert-error" role="alert">{error.message}</div>}
      {loading ? (
        <Loader message="Loading your exams..." />
      ) : exams.length === 0 ? (
        error ? null : <div className="manage-exams-empty">
          <p>You have not created any exams yet.</p>
          <Link className="btn" to="/doctor/create-exam">Create your first exam</Link>
        </div>
      ) : (
        <div className="manage-exams-table-wrapper">
          <table className="manage-exams-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th className="manage-exams-number">Duration</th>
                <th>Window (local time)</th>
                <th className="manage-exams-number">Marks</th>
                <th>Status</th>
                <th className="manage-exams-number">Questions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>{exam.title}</td>
                  <td>{exam.subjects?.name || 'Unassigned'}</td>
                  <td className="manage-exams-number">{exam.duration_minutes} min</td>
                  <td className="manage-exams-window">
                    <span>Starts: {formatDateTime(exam.start_time, 'Immediately')}</span>
                    <span>Ends: {formatDateTime(exam.end_time, 'No end time')}</span>
                  </td>
                  <td className="manage-exams-number">{exam.total_marks}</td>
                  <td>
                    <span className={`exam-badge exam-badge--${exam.is_active ? 'active' : 'inactive'}`}>
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="manage-exams-number">{exam.questions?.length ?? 0}</td>
                  <td>
                    <div className="manage-exams-actions">
                      <Link className="btn btn-secondary" to={`/doctor/exams/${exam.id}/results`}>
                        View results
                      </Link>
                      {exam.attempts?.length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={deletingId === exam.id}
                          onClick={() => handleDeactivate(exam)}
                        >
                          Hide
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={deletingId === exam.id}
                          onClick={() => handleDelete(exam)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
