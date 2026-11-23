import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import { getAvailableExams } from '../services/examsService.js';
import { filterExams, getExamStatus, parseDuration } from '../utils/filterExams.js';
import './Exams.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/Exams.jsx
// Route: /exams   (student)
// ----------------------------------------------------------------------------
// The student's entry point: every exam that is open right now, searchable and
// filterable by subject. Nothing is fetched per keystroke - the list is loaded
// once and filtered in the browser by utils/filterExams.js, which keeps the page
// fast and the network quiet.
// ============================================================================
export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchExams() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await getAvailableExams();
      if (!cancelled) {
        if (err) {
          setError(err.message || 'Failed to load exams.');
        } else {
          setExams(data || []);
        }
        setLoading(false);
      }
    }

    fetchExams();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subject list extracted from the exams loaded
  const subjectsMap = new Map();
  for (const exam of exams) {
    if (exam.subject_id && exam.subjects?.name) {
      subjectsMap.set(exam.subject_id, {
        id: exam.subject_id,
        name: exam.subjects.name,
        code: exam.subjects.code,
      });
    }
  }
  const subjects = Array.from(subjectsMap.values());

  const filteredExams = filterExams(exams, searchQuery, selectedSubjectId);

  return (
    <section className="exams-page">
      <header className="page-header">
        <h1>Available exams</h1>
        <p>
          Every exam that is open for you right now, with its subject, its
          duration and its total marks. Open one to read the rules before you
          start it.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div className="exams-toolbar">
        <div className="form-group">
          <label htmlFor="exam-search">Search exams</label>
          <input
            id="exam-search"
            type="text"
            className="input"
            placeholder="Search by title, description or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject-filter">Filter by subject</label>
          <select
            id="subject-filter"
            className="input"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} {sub.code ? `(${sub.code})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="exams-count"
        style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-muted)' }}
      >
        Showing {filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'}
      </div>

      {loading && <Loader message="Loading available exams..." />}

      {error && !loading && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && filteredExams.length === 0 && (
        <div className="alert alert-info">
          {exams.length === 0
            ? 'No exams are currently available.'
            : 'No exams match your search.'}
        </div>
      )}

      {!loading && !error && filteredExams.length > 0 && (
        <div className="exams-grid">
          {filteredExams.map((exam) => {
            const status = getExamStatus(exam);
            return (
              <article key={exam.id} className="exam-card">
                <span className={`exam-status exam-status--${status}`}>
                  {status}
                </span>
                <h2>{exam.title}</h2>
                {exam.description && (
                  <p className="exam-card-description">{exam.description}</p>
                )}
                <div className="exam-card-meta">
                  {exam.subjects && (
                    <div>
                      <strong>Subject:</strong> {exam.subjects.name}{' '}
                      {exam.subjects.code && `(${exam.subjects.code})`}
                    </div>
                  )}
                  <div>
                    <strong>Duration:</strong> {parseDuration(exam.duration_minutes)}
                  </div>
                  <div>
                    <strong>Total marks:</strong> {exam.total_marks}
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)' }}>
                  <Link
                    to={`/exams/${exam.id}`}
                    className="btn btn-primary"
                    style={{ display: 'inline-block' }}
                  >
                    View details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
