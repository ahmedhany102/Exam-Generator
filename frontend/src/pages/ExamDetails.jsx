import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import { getOpenAttempt } from '../services/attemptsService.js';
import { getExamById } from '../services/examsService.js';
import { getExamStatus, parseDuration } from '../utils/filterExams.js';
import './ExamDetails.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/ExamDetails.jsx
// Route: /exams/:examId   (student)
// ----------------------------------------------------------------------------
// The read-before-you-start screen: what the exam is, how long it lasts, how it
// is marked, and the one rule that matters - a student sits an exam once. The
// "Start exam" button is therefore not always enabled: it depends on whether an
// attempt row already exists for this pair of exam and student.
// ============================================================================
export default function ExamDetails() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      const { data: examData, error: examErr } = await getExamById(examId);

      if (cancelled) return;

      if (examErr || !examData) {
        setError(examErr?.message || 'Exam not found');
        setLoading(false);
        return;
      }

      setExam(examData);

      // Cross-owner dependency: attemptsService.getOpenAttempt(examId) belongs
      // to Ahmed Fayez (member3). While it may throw or return an error before
      // member3 is merged, we wrap in try/catch and keep attempt = null on failure.
      try {
        const { data: openAttempt } = await getOpenAttempt(examId);
        if (!cancelled && openAttempt) {
          setAttempt(openAttempt);
        }
      } catch {
        // Tolerated until member3 lands
        if (!cancelled) {
          setAttempt(null);
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  if (loading) {
    return (
      <section className="exam-details-page">
        <Loader message="Loading exam details..." />
      </section>
    );
  }

  if (error || !exam) {
    return (
      <section className="exam-details-page">
        <header className="page-header">
          <h1>Exam not found</h1>
          <p>The exam you requested could not be found or is not available.</p>
        </header>
        <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>
        <div
          className="alert alert-error"
          role="alert"
          style={{ marginBottom: 'var(--space-md)' }}
        >
          {error || 'Exam not found'}
        </div>
        <Link to="/exams" className="btn btn-secondary">
          &larr; Back to available exams
        </Link>
      </section>
    );
  }

  const examStatus = getExamStatus(exam);
  const isAlreadySubmitted =
    attempt?.status === 'submitted' || attempt?.status === 'auto_submitted';
  const isInProgress = attempt?.status === 'in_progress';

  let buttonText = 'Start exam';
  if (isInProgress) {
    buttonText = 'Resume exam';
  } else if (isAlreadySubmitted) {
    buttonText = 'Already attempted';
  }

  const isButtonDisabled = isAlreadySubmitted || examStatus === 'closed';

  return (
    <section className="exam-details-page">
      <header className="page-header">
        <h1>{exam.title}</h1>
        {exam.subjects && (
          <p>
            <strong>Subject:</strong> {exam.subjects.name}{' '}
            {exam.subjects.code ? `(${exam.subjects.code})` : ''}
          </p>
        )}
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div style={{ marginBottom: 'var(--space-md)' }}>
        <span className={`exam-status exam-status--${examStatus}`}>
          Status: {examStatus}
        </span>
      </div>

      {exam.description && (
        <p style={{ marginBottom: 'var(--space-lg)', fontSize: '1rem' }}>
          {exam.description}
        </p>
      )}

      <div className="exam-meta">
        <div className="exam-meta-item">
          <span className="exam-meta-label">Duration</span>
          <span className="exam-meta-value">
            {parseDuration(exam.duration_minutes)}
          </span>
        </div>
        <div className="exam-meta-item">
          <span className="exam-meta-label">Total Marks</span>
          <span className="exam-meta-value">{exam.total_marks}</span>
        </div>
        <div className="exam-meta-item">
          <span className="exam-meta-label">Attempts Allowed</span>
          <span className="exam-meta-value">1 attempt</span>
        </div>
        {exam.start_time && (
          <div className="exam-meta-item">
            <span className="exam-meta-label">Opens</span>
            <span className="exam-meta-value" style={{ fontSize: '0.85rem' }}>
              {new Date(exam.start_time).toLocaleString()}
            </span>
          </div>
        )}
        {exam.end_time && (
          <div className="exam-meta-item">
            <span className="exam-meta-label">Closes</span>
            <span className="exam-meta-value" style={{ fontSize: '0.85rem' }}>
              {new Date(exam.end_time).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <h2>Exam Rules & Instructions</h2>
      <ul className="exam-rules">
        <li>
          <strong>Duration:</strong> {parseDuration(exam.duration_minutes)}. The timer
          starts immediately when you enter the exam.
        </li>
        <li>
          <strong>Total Marks:</strong> {exam.total_marks} marks.
        </li>
        <li>
          <strong>One Attempt:</strong> You can only take this exam once. Duplicate
          attempts are prevented by the system.
        </li>
        <li>
          <strong>Auto-Save:</strong> Answers are saved as you select them so
          refreshing or navigating will not lose your progress.
        </li>
        <li>
          <strong>Auto-Submit:</strong> When the countdown timer reaches zero, your exam
          will be submitted automatically with your saved answers.
        </li>
      </ul>

      {isAlreadySubmitted && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-md)' }}>
          You have already completed this exam. You cannot take it again.
        </div>
      )}

      {examStatus === 'upcoming' && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-md)' }}>
          This exam is not open yet. Please check back at the scheduled opening time.
        </div>
      )}

      {examStatus === 'closed' && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
          This exam has closed and is no longer accepting attempts.
        </div>
      )}

      <div className="exam-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isButtonDisabled || examStatus === 'upcoming'}
          onClick={() => navigate(`/exams/${exam.id}/take`)}
        >
          {buttonText}
        </button>

        <Link to="/exams" className="btn btn-secondary">
          Back to exams
        </Link>
      </div>
    </section>
  );
}
