import './CreateExam.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import { MCQ_OPTION_COUNT, sumQuestionMarks, validateExam } from '../utils/validateExam.js';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: pages/CreateExam.jsx
// Route: /doctor/create-exam   (doctor)
// ----------------------------------------------------------------------------
// The dynamic exam builder: one exam header plus a list of multiple-choice
// questions that the doctor grows and shrinks while typing. It is the hardest
// page in this branch, so the plan is written down here before the code.
//
// Dependencies:
//   utils/validateExam.js (this branch)  -> validateExam() / sumQuestionMarks()
//   services/examsService.js (Ibrahim Lotfy, member2) -> if he exposes the
//     exam/question/option insert helpers, call those; otherwise insert from
//     here through lib/supabaseClient.js and move the code into a service in
//     M3. Either way the INSERT ORDER below is what matters.
//
// Implementation notes:
//   1. Exam state: title, subjectId, description, durationMinutes. Question
//      state is ONE array - useState([emptyQuestion()]) - where each item is
//      { key, text, marks, options: ['', '', '', ''], correctIndex: 0 }.
//      One array instead of one useState per field: a field per question
//      cannot be declared for a list that grows at runtime.
//   2. Give every question a stable `key` (crypto.randomUUID()) and use it as
//      the React key. Using the array index instead makes React reuse the
//      wrong input's DOM when question 2 of 5 is deleted.
//   3. Buttons: "Add question", "Remove question" (keep at least one),
//      "Add option" / "Remove option" bounded by MCQ_OPTION_COUNT, and a radio
//      group per question (name={`correct-${question.key}`}) writing
//      correctIndex. All updates go through the functional setQuestions(prev =>
//      ...) form and never mutate the old array: React only re-renders on a
//      new object.
//   4. Live total marks: totalMarks is DERIVED, not typed - render
//      sumQuestionMarks(questions) in .create-exam-total and send that number
//      as exams.total_marks. Two sources of truth would drift apart.
//   5. On submit, run validateExam() before the first insert; print every error inside
//      .alert.alert-error and stop before the first INSERT.
//   6. INSERT ORDER (Postgres will not give us the ids any other way):
//        a. insert the `exams` row with created_by = auth uid and
//           is_active: false, then .select('id, is_active').single() to learn
//           exam_id and confirm that students cannot yet access the draft.
//        b. insert the `questions` rows in one call, each carrying exam_id,
//           question_text, marks and one-based order_index, then select and
//           sort the saved rows so each id maps back to the question written.
//        c. build one flat array of { question_id, option_text, is_correct }
//           from every question (is_correct = optionIndex === correctIndex)
//           and insert it as ONE call: four calls per question would be 4x
//           the round trips.
//        d. publish only after all child rows are verified, then navigate.
//   7. There is no transaction over the REST API: insert as inactive, verify
//      all question and option rows, then activate. On failure, confirm the
//      draft is inactive before attempting cleanup and report cleanup errors.
//   8. Guard double submits with a `saving` useState flag on the button; a
//      second click would create a second empty exam.
//   9. Subject list: read `subjects` first, then let the doctor pick; a subject
//      with doctor_id = null belongs to the admin-managed catalogue.
// ============================================================================
export default function CreateExam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const makeQuestion = () => ({
    key: globalThis.crypto?.randomUUID?.() ?? `question-${Date.now()}-${Math.random()}`,
    text: '',
    marks: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });
  const [questions, setQuestions] = useState([makeQuestion()]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubjects() {
      try {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, code')
          .order('name', { ascending: true });
        if (error) throw error;
        if (!cancelled) {
          setSubjects(data ?? []);
          setSubjectsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSubjectsError(error instanceof Error
            ? error
            : new Error(error?.message || 'Could not load subjects.'));
        }
      } finally {
        if (!cancelled) setSubjectsLoading(false);
      }
    }
    loadSubjects();
    return () => { cancelled = true; };
  }, []);

  const totalMarks = sumQuestionMarks(questions);

  function updateQuestion(key, updates) {
    setQuestions((current) =>
      current.map((question) => (question.key === key ? { ...question, ...updates } : question)),
    );
  }

  function updateOption(key, optionIndex, value) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.key !== key) return question;
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      }),
    );
  }

  function addOption(key) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.key !== key || question.options.length >= MCQ_OPTION_COUNT) return question;
        return { ...question, options: [...question.options, ''] };
      }),
    );
  }

  function removeOption(key, optionIndex) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.key !== key || question.options.length <= 2) return question;
        const options = question.options.filter((_, index) => index !== optionIndex);
        let correctIndex = question.correctIndex;
        if (correctIndex === optionIndex) {
          const nonEmptyOptionIndex = options.findIndex((option) => option.trim());
          correctIndex = nonEmptyOptionIndex >= 0
            ? nonEmptyOptionIndex
            : Math.min(optionIndex, options.length - 1);
        } else if (correctIndex > optionIndex) {
          correctIndex -= 1;
        }
        return { ...question, options, correctIndex };
      }),
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, makeQuestion()]);
  }

  function removeQuestion(key) {
    setQuestions((current) =>
      current.length === 1 ? current : current.filter((question) => question.key !== key),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || savingRef.current) return;
    setSaveError('');

    const draft = {
      title,
      subjectId,
      durationMinutes,
      startTime,
      endTime,
      totalMarks,
      questions,
    };
    const result = validateExam(draft);
    setValidationErrors(result.errors);
    if (!result.valid) return;

    if (!supabase || !user) {
      setSaveError('Supabase is not configured or you are not signed in.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    let createdExamId = null;
    let activationAttempted = false;
    try {
      const examPayload = {
        subject_id: subjectId,
        title: title.trim(),
        description: description.trim(),
        duration_minutes: Number(durationMinutes),
        total_marks: totalMarks,
        created_by: user.id,
        is_active: false,
      };
      if (startTime) examPayload.start_time = new Date(startTime).toISOString();
      if (endTime) examPayload.end_time = new Date(endTime).toISOString();

      const examInsert = await supabase
        .from('exams')
        .insert(examPayload)
        .select('id, is_active')
        .single();
      if (examInsert.error) throw examInsert.error;
      createdExamId = examInsert.data?.id;
      if (!createdExamId || examInsert.data.is_active !== false) {
        throw new Error('The exam draft could not be confirmed as inactive.');
      }

      const questionRows = questions.map((question, index) => ({
        exam_id: createdExamId,
        question_text: question.text.trim(),
        marks: Number(question.marks),
        order_index: index + 1,
      }));
      const questionInsert = await supabase
        .from('questions')
        .insert(questionRows)
        .select('id, order_index, marks');
      if (questionInsert.error) throw questionInsert.error;

      const questionIds = [...(questionInsert.data ?? [])].sort(
        (left, right) => left.order_index - right.order_index,
      );
      if (
        questionIds.length !== questions.length
        || questionIds.some((question, index) => (
          !question.id
          || question.order_index !== index + 1
          || Number(question.marks) !== Number(questions[index].marks)
        ))
      ) {
        throw new Error('The saved question rows did not match the form.');
      }

      const optionRows = [];
      questions.forEach((question, questionIndex) => {
        question.options.forEach((optionText, optionIndex) => {
          optionRows.push({
            question_id: questionIds[questionIndex].id,
            option_text: optionText.trim(),
            is_correct: optionIndex === question.correctIndex,
          });
        });
      });
      const optionInsert = await supabase
        .from('options')
        .insert(optionRows)
        .select('id, question_id, option_text, is_correct');
      if (optionInsert.error) throw optionInsert.error;
      const savedOptions = optionInsert.data ?? [];
      if (savedOptions.length !== optionRows.length) {
        throw new Error('The saved option count did not match the form.');
      }
      questionIds.forEach((question, questionIndex) => {
        const savedQuestionOptions = savedOptions.filter(
          (option) => option.question_id === question.id,
        );
        const correctOptions = savedQuestionOptions.filter((option) => option.is_correct);
        const unmatchedOptions = [...savedQuestionOptions];
        const expectedOptions = questions[questionIndex].options.map((optionText, optionIndex) => ({
          option_text: optionText.trim(),
          is_correct: optionIndex === questions[questionIndex].correctIndex,
        }));
        const optionsMatch = expectedOptions.every((expectedOption) => {
          const matchIndex = unmatchedOptions.findIndex((savedOption) => (
            savedOption.option_text === expectedOption.option_text
            && savedOption.is_correct === expectedOption.is_correct
          ));
          if (matchIndex === -1) return false;
          unmatchedOptions.splice(matchIndex, 1);
          return true;
        });
        if (
          savedQuestionOptions.length !== MCQ_OPTION_COUNT
          || correctOptions.length !== 1
          || !optionsMatch
          || unmatchedOptions.length !== 0
        ) {
          throw new Error(`Saved options for question ${questionIndex + 1} could not be verified.`);
        }
      });

      activationAttempted = true;
      const activation = await supabase
        .from('exams')
        .update({ is_active: true })
        .eq('id', createdExamId)
        .eq('created_by', user.id)
        .select('id, is_active')
        .single();
      if (activation.error) throw activation.error;
      if (activation.data?.id !== createdExamId || activation.data.is_active !== true) {
        throw new Error('The complete exam could not be confirmed as published.');
      }

    } catch (error) {
      const creationMessage = error?.message || 'Could not create the exam.';
      let cleanupMessage = '';
      if (createdExamId) {
        let safeToDelete = true;
        if (activationAttempted) {
          try {
            const deactivation = await supabase
              .from('exams')
              .update({ is_active: false })
              .eq('id', createdExamId)
              .eq('created_by', user.id)
              .select('id, is_active')
              .maybeSingle();
            if (
              deactivation.error
              || !deactivation.data
              || deactivation.data.is_active !== false
            ) {
              safeToDelete = false;
              cleanupMessage = ` Could not confirm that exam ${createdExamId} is inactive. Hide it from My Exams immediately. ${deactivation.error?.message || 'No inactive exam row was returned.'}`;
            }
          } catch (cleanupError) {
            safeToDelete = false;
            cleanupMessage = ` Could not confirm that exam ${createdExamId} is inactive. Hide it from My Exams immediately. ${cleanupError?.message || 'The deactivation request failed.'}`;
          }
        }

        if (safeToDelete) {
          try {
            const cleanup = await supabase
              .from('exams')
              .delete()
              .eq('id', createdExamId)
              .eq('created_by', user.id)
              .select('id')
              .maybeSingle();
            if (cleanup.error || !cleanup.data) {
              cleanupMessage = ` The incomplete exam remains inactive as draft ${createdExamId}; automatic cleanup failed: ${cleanup.error?.message || 'the deleted row could not be confirmed'}. Check My Exams and delete the draft if it is still listed.`;
            }
          } catch (cleanupError) {
            cleanupMessage = ` The incomplete exam remains inactive as draft ${createdExamId}; automatic cleanup failed: ${cleanupError?.message || 'the delete request failed'}. Check My Exams and delete the draft if it is still listed.`;
          }
        }
      } else {
        cleanupMessage = ' The exam request did not return an ID, so cleanup could not be verified. Check My Exams for an inactive draft.';
      }
      setSaveError(`Could not create the exam: ${creationMessage}${cleanupMessage}`);
      return;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }

    const successMessage = `"${title.trim()}" was created and published successfully.`;
    navigate('/doctor/my-exams', { state: { notice: successMessage } });
  }

  return (
    <section className="create-exam-page">
      <header className="page-header">
        <h1>Create exam</h1>
        <p>
          Build a multiple-choice exam question by question; the total marks add up as
          you type.
        </p>
      </header>

      {subjectsLoading ? (
        <Loader message="Loading subjects..." />
      ) : subjectsError ? (
        <div className="alert alert-error">{subjectsError.message}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {validationErrors.length > 0 && (
            <div className="alert alert-error" role="alert">
              <ul>
                {validationErrors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            </div>
          )}
          {saveError && <div className="alert alert-error" role="alert">{saveError}</div>}

          <section className="card">
            <h2>Exam details</h2>
            <div className="create-exam-header-grid">
              <div className="form-group">
                <label htmlFor="exam-title">Exam title</label>
                <input id="exam-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="exam-subject">Subject</label>
                <select id="exam-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="exam-duration">Duration (minutes)</label>
                <input id="exam-duration" type="number" min="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="exam-start">Start time (optional)</label>
                <input id="exam-start" type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="exam-end">End time (optional)</label>
                <input id="exam-end" type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="exam-description">Description</label>
              <textarea id="exam-description" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          </section>

          <div className="create-exam-total">
            <span>Live total marks</span>
            <strong>{totalMarks}</strong>
          </div>

          {questions.map((question, questionIndex) => (
            <section className="create-exam-question" key={question.key}>
              <div className="create-exam-question-header">
                <span>Question {questionIndex + 1}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => removeQuestion(question.key)}
                  disabled={questions.length === 1}
                >
                  Remove question
                </button>
              </div>
              <div className="form-group">
                <label htmlFor={`question-${question.key}`}>Question text</label>
                <input
                  id={`question-${question.key}`}
                  value={question.text}
                  onChange={(event) => updateQuestion(question.key, { text: event.target.value })}
                />
              </div>
              <div className="form-group create-exam-marks">
                <label htmlFor={`marks-${question.key}`}>Marks</label>
                <input
                  id={`marks-${question.key}`}
                  type="number"
                  min="1"
                  value={question.marks}
                  onChange={(event) => updateQuestion(question.key, { marks: event.target.value })}
                />
              </div>
              {question.options.map((option, optionIndex) => (
                <div
                  className={`create-exam-option-row${optionIndex === question.correctIndex ? ' create-exam-option-row--correct' : ''}`}
                  key={`${question.key}-${optionIndex}`}
                >
                  <input
                    type="radio"
                    name={`correct-${question.key}`}
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    checked={optionIndex === question.correctIndex}
                    onChange={() => updateQuestion(question.key, { correctIndex: optionIndex })}
                  />
                  <input
                    type="text"
                    aria-label={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(event) => updateOption(question.key, optionIndex, event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary create-exam-option-remove"
                    aria-label={`Remove option ${optionIndex + 1} from question ${questionIndex + 1}`}
                    onClick={() => removeOption(question.key, optionIndex)}
                    disabled={question.options.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="create-exam-option-controls">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addOption(question.key)}
                  disabled={question.options.length >= MCQ_OPTION_COUNT}
                >
                  Add option
                </button>
                <span>{question.options.length} of {MCQ_OPTION_COUNT} options</span>
              </div>
            </section>
          ))}

          <div className="create-exam-actions">
            <button type="button" className="btn btn-secondary" onClick={addQuestion}>Add question</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Create exam'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
