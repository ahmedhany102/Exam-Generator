// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: utils/validateExam.js
// ----------------------------------------------------------------------------
// Client-side validation for the dynamic exam builder (pages/CreateExam.jsx).
//
// This module imports nothing and touches no Supabase client on purpose: it is
// a pure function of what the doctor typed. That keeps the page free of rules,
// makes the rules readable in a code review, and lets anyone check them without
// a database connection.
//
// The database is still the last line of defence (NOT NULL / CHECK constraints
// in database/01_schema.sql and the RLS policies in 02_rls.sql, member1). This
// check only exists so the doctor sees every mistake at once, before the first
// INSERT runs, instead of one failed request per mistake.
//
// Validation behavior:
//   1. Collect messages in an errors[] array and return ALL of them, not just
//      the first one: the doctor fixes the whole form in one pass.
//   2. Check in a fixed order (exam header -> questions -> marks total) so the
//      list reads top-to-bottom like the form on screen.
//   3. Treat whitespace-only text as empty (value.trim() === ''), otherwise a
//      row of spaces passes as a title.
//   4. Number the questions from 1 in the messages ("Question 3 needs exactly
//      1 correct option"): the page prints the strings verbatim.
//   5. Never throw. Invalid input is a normal answer, not an exception.
// ============================================================================

/** Every multiple-choice question in this system has exactly 4 options. */
export const MCQ_OPTION_COUNT = 4;

const MAX_INTEGER = 2_147_483_647;

function parseInteger(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isOptionalDateTime(value) {
  return value === undefined || value === null || value === '';
}

function parseDateTime(value) {
  if (typeof value !== 'string') return null;
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
  if (!parts) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0'] = parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31, leapYear ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ][month - 1];
  if (
    !daysInMonth
    || day < 1
    || day > daysInMonth
    || hour > 23
    || minute > 59
    || second > 59
  ) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Add up the marks of every question in the exam being built.
 *
 * @param {Array<{ marks: number|string }>} questions  rows of form state
 * @returns {number} the total the doctor sees live while typing
 *
 * Input values may be strings from number inputs; empty or invalid values
 * contribute zero rather than being concatenated during the sum.
 */
export function sumQuestionMarks(questions) {
  if (!Array.isArray(questions)) return 0;
  return questions.reduce((sum, question) => {
    const marks = parseInteger(question?.marks);
    return sum + (marks !== null && marks > 0 ? marks : 0);
  }, 0);
}

/**
 * Validate a whole exam before CreateExam.jsx inserts anything.
 *
 * @param {object} exam
 * @param {string} exam.title                    exams.title
 * @param {string} exam.subjectId                exams.subject_id (chosen from subjects)
 * @param {number|string} exam.durationMinutes   exams.duration_minutes
 * @param {number|string} exam.totalMarks        exams.total_marks
 * @param {string} [exam.startTime]              optional local exam start
 * @param {string} [exam.endTime]                optional local exam end
 * @param {Array<{ text: string, marks: number|string,
 *   options: string[], correctIndex: number }>} exam.questions
 * @returns {{ valid: boolean, errors: string[] }} valid === (errors.length === 0)
 *
 * Validation rules:
 *   1. Required header: title (after trim), subjectId, and positive integer
 *      durationMinutes / totalMarks that fit PostgreSQL's integer type.
 *   2. At least one question.
 *   3. Per question: non-empty text, marks > 0, exactly MCQ_OPTION_COUNT
 *      non-empty options, and exactly ONE correct answer whose index points at
 *      a non-empty option (a correct answer on an empty option is not gradeable).
 *   4. Last check: sumQuestionMarks(questions) === Number(totalMarks). The
 *      doctor edits question marks freely, so this is the guard that keeps
 *      exams.total_marks consistent with the questions table. The same rule is
 *      enforced again by the trigger/CHECK in database/01_schema.sql.
 *   5. Return { valid: errors.length === 0, errors }.
 */
export function validateExam(exam) {
  const draft = exam && typeof exam === 'object' ? exam : {};
  const errors = [];

  if (typeof draft.title !== 'string' || !draft.title.trim()) {
    errors.push('Exam title is required.');
  }
  if (typeof draft.subjectId !== 'string' || !draft.subjectId.trim()) {
    errors.push('Please select a subject.');
  }

  const duration = parseInteger(draft.durationMinutes);
  if (duration === null || duration <= 0 || duration > MAX_INTEGER) {
    errors.push('Duration must be a positive whole number of minutes.');
  }
  const totalMarks = parseInteger(draft.totalMarks);
  if (totalMarks === null || totalMarks <= 0 || totalMarks > MAX_INTEGER) {
    errors.push('Total marks must be a positive whole number within the supported range.');
  }

  const startTime = isOptionalDateTime(draft.startTime) ? null : draft.startTime;
  const endTime = isOptionalDateTime(draft.endTime) ? null : draft.endTime;
  const parsedStart = startTime === null ? null : parseDateTime(startTime);
  const parsedEnd = endTime === null ? null : parseDateTime(endTime);
  if (startTime !== null && parsedStart === null) {
    errors.push('Start time must be a valid date and time.');
  }
  if (endTime !== null && parsedEnd === null) {
    errors.push('End time must be a valid date and time.');
  }
  if (
    startTime !== null
    && endTime !== null
    && parsedStart !== null
    && parsedEnd !== null
    && parsedEnd <= parsedStart
  ) {
    errors.push('End time must be later than start time.');
  }

  const questions = Array.isArray(draft.questions) ? draft.questions : [];
  if (questions.length === 0) {
    errors.push('Add at least one question.');
  }

  questions.forEach((question, index) => {
    const number = index + 1;
    if (typeof question?.text !== 'string' || !question.text.trim()) {
      errors.push(`Question ${number} needs valid question text.`);
    }

    const marks = parseInteger(question?.marks);
    if (marks === null || marks <= 0 || marks > MAX_INTEGER) {
      errors.push(`Question ${number} needs positive whole-number marks within the supported range.`);
    }

    const options = Array.isArray(question?.options) ? question.options : [];
    if (options.length !== MCQ_OPTION_COUNT) {
      errors.push(`Question ${number} needs exactly ${MCQ_OPTION_COUNT} options.`);
    } else {
      options.forEach((option, optionIndex) => {
        if (typeof option !== 'string' || !option.trim()) {
          errors.push(`Question ${number}, option ${optionIndex + 1} needs valid text.`);
        }
      });
    }

    const correctIndex = parseInteger(question?.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= MCQ_OPTION_COUNT) {
      errors.push(`Question ${number} needs exactly 1 correct option.`);
    } else if (!options[correctIndex] || !String(options[correctIndex]).trim()) {
      errors.push(`Question ${number} needs 1 correct option with valid option text.`);
    }
  });

  if (questions.length > 0 && totalMarks !== null && totalMarks > 0) {
    const sum = sumQuestionMarks(questions);
    if (!Number.isSafeInteger(sum) || sum > MAX_INTEGER) {
      errors.push('The combined question marks exceed the supported total.');
    }
    if (sum !== totalMarks) {
      errors.push(`Question marks (${sum}) must equal the exam total (${totalMarks}).`);
    }
  }

  return { valid: errors.length === 0, errors };
}
