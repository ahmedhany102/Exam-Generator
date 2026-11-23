import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { supabase } from '../lib/supabaseClient.js';
import {
  getOpenAttempt,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from '../services/attemptsService.js';
import {
  getExamById,
  getExamQuestionsWithoutAnswers,
} from '../services/examsService.js';
import './TakeExam.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/TakeExam.jsx
// Route: /exams/:examId/take   (student)
// ----------------------------------------------------------------------------
// The timed exam screen.
// ============================================================================
export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attempt, setAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  const submittingRef = useRef(false);

  // 1. Initial data load and attempt setup
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);

      const [examRes, questionsRes] = await Promise.all([
        getExamById(examId),
        getExamQuestionsWithoutAnswers(examId),
      ]);

      if (cancelled) return;

      if (examRes.error || !examRes.data) {
        setError(examRes.error?.message || 'Exam not found');
        setLoading(false);
        return;
      }
      setExam(examRes.data);

      if (questionsRes.error) {
        setError(questionsRes.error.message || 'Failed to load questions');
        setLoading(false);
        return;
      }
      const loadedQuestions = questionsRes.data || [];
      setQuestions(loadedQuestions);

      // Attempt lifecycle
      let currentAttempt = null;
      try {
        const openRes = await getOpenAttempt(examId);
        if (openRes?.data) {
          currentAttempt = openRes.data;
        } else {
          // If no open attempt exists, start a new one
          const startRes = await startAttempt(examId);
          if (startRes?.data) {
            currentAttempt = startRes.data;
          } else if (startRes?.error) {
            setError(startRes.error.message || 'Failed to start exam');
          }
        }
      } catch (err) {
        // Cross-owner dependency: attemptsService belongs to member3.
        console.warn('attemptsService call threw (waiting for member3):', err);
        setError(err.message || 'Attempts service unavailable');
      }

      if (cancelled) return;

      if (currentAttempt) {
        if (
          currentAttempt.status === 'submitted' ||
          currentAttempt.status === 'auto_submitted'
        ) {
          setIsAlreadySubmitted(true);
          setLoading(false);
          return;
        }

        setAttempt(currentAttempt);

        // Compute deadline from server attempt started_at
        const startedAt = new Date(currentAttempt.started_at || Date.now()).getTime();
        const durationMin = examRes.data.duration_minutes || 0;
        const deadline = startedAt + durationMin * 60 * 1000;
        const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        setRemainingSeconds(secondsLeft);

        // Resume saved answers from database if any
        if (supabase && currentAttempt.id) {
          try {
            const { data: savedRows } = await supabase
              .from('answers')
              .select('question_id, selected_option_id')
              .eq('attempt_id', currentAttempt.id);

            if (!cancelled && savedRows && savedRows.length > 0) {
              const restored = {};
              for (const row of savedRows) {
                if (row.question_id && row.selected_option_id) {
                  restored[row.question_id] = row.selected_option_id;
                }
              }
              setAnswers(restored);
            }
          } catch {
            // Answers table query failure is non-fatal
          }
        }
      }

      setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  // 2. Submission handler
  const doSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);

      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_option_id: answers[q.id] || null,
      }));

      try {
        const attemptId = attempt?.id;
        const res = await submitAttempt(attemptId, answersPayload, { autoSubmitted });
        if (res?.error) {
          setError(res.error.message || 'Failed to submit exam');
          submittingRef.current = false;
          setSubmitting(false);
          return;
        }
        navigate('/my-results', { replace: true });
      } catch (err) {
        console.warn('submitAttempt threw:', err);
        setError(err.message || 'Submission failed');
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [attempt?.id, questions, answers, navigate],
  );

  // 3. Countdown timer with clearInterval cleanup
  useEffect(() => {
    if (!attempt || !exam || submitting || isAlreadySubmitted) {
      return;
    }

    if (remainingSeconds !== null && remainingSeconds <= 0) {
      doSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      const startedAt = new Date(attempt.started_at || Date.now()).getTime();
      const deadline = startedAt + (exam.duration_minutes || 0) * 60 * 1000;
      const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(interval);
        doSubmit(true);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [attempt, exam, submitting, isAlreadySubmitted, remainingSeconds, doSubmit]);

  // 4. Option selection and answer saving
  async function handleSelectOption(questionId, optionId) {
    if (submitting) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));

    if (attempt?.id) {
      try {
        await saveAnswer(attempt.id, questionId, optionId);
      } catch (err) {
        console.warn('saveAnswer threw (waiting for member3):', err);
      }
    }
  }

  if (loading) {
    return (
      <section className="take-exam-page">
        <Loader message="Preparing your exam..." />
      </section>
    );
  }

  if (isAlreadySubmitted) {
    return (
      <section className="take-exam-page">
        <header className="page-header">
          <h1>Exam already completed</h1>
          <p>You have already submitted an attempt for this exam.</p>
        </header>
        <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-md)' }}>
          Only one attempt per exam is allowed. You can review your score in your results.
        </div>
        <Link to="/my-results" className="btn btn-primary">
          View my results
        </Link>
      </section>
    );
  }

  if (error && !exam) {
    return (
      <section className="take-exam-page">
        <header className="page-header">
          <h1>Exam error</h1>
        </header>
        <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>
        <div className="alert alert-error" role="alert">
          {error}
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <Link to="/exams" className="btn btn-secondary">
            Back to exams
          </Link>
        </div>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="take-exam-page">
        <header className="page-header">
          <h1>{exam?.title || 'Take exam'}</h1>
        </header>
        <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>
        <div className="alert alert-warning">
          This exam has no questions available yet.
        </div>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <Link to="/exams" className="btn btn-secondary">
            Back to exams
          </Link>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[currentIndex] || questions[0];
  const isCurrentAnswered = Boolean(answers[currentQuestion?.id]);
  const answeredCount = Object.keys(answers).filter((qId) => Boolean(answers[qId])).length;

  const minutes = Math.floor(Math.max(0, remainingSeconds ?? 0) / 60);
  const seconds = Math.max(0, remainingSeconds ?? 0) % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimerWarning = (remainingSeconds ?? 60) <= 60;

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <section className="take-exam-page">
      <header className="page-header">
        <h1>{exam?.title}</h1>
        <p>
          Answer each question. Your choices are saved immediately. The exam
          submits automatically when time expires.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      {error && (
        <div
          className="alert alert-error"
          role="alert"
          style={{ marginBottom: 'var(--space-md)' }}
        >
          {error}
        </div>
      )}

      {/* Sticky timer banner */}
      <div className="exam-timer">
        <div>
          <strong>Time Remaining:</strong>
        </div>
        <div
          className={`exam-timer-value ${
            isTimerWarning ? 'exam-timer-value--warning' : ''
          }`}
          aria-live="polite"
        >
          {timerFormatted}
        </div>
      </div>

      {/* Progress of answered questions */}
      <ProgressBar
        label="Answered"
        value={answeredCount}
        max={questions.length}
        suffix={`/ ${questions.length}`}
      />

      {/* Current Question Card */}
      <article className="exam-question-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 'var(--space-sm)',
            fontSize: '0.88rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>{currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}</span>
        </div>

        <h2 className="exam-question-text">{currentQuestion.question_text}</h2>

        <ul className="exam-options">
          {currentQuestion.options?.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={`exam-option ${isSelected ? 'exam-option--selected' : ''}`}
                  onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                  disabled={submitting}
                >
                  <span>{option.option_text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </article>

      {/* Navigation and Submission controls */}
      <div className="take-exam-nav">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          disabled={currentIndex === 0 || submitting}
        >
          &larr; Previous
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          {!isLastQuestion ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))
              }
              disabled={!isCurrentAnswered || submitting}
            >
              Next &rarr;
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => doSubmit(false)}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit exam'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
