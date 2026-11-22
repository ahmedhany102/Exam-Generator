import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Register.css';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: pages/Register.jsx
// Route: /register   (public)
// ----------------------------------------------------------------------------
// Public registration creates STUDENT accounts only. That is a security rule,
// not a UI preference:
//   * the form sends email, password and full_name - never a role;
//   * the database trigger handle_new_user() writes the profiles row with
//     role = 'student' inside the same transaction as the auth user;
//   * doctor accounts are promoted by an administrator (ManageUsers.jsx).
//
// The page therefore performs NO insert into `profiles`: doing it here as well
// would race the trigger and fail with a duplicate key.
// ============================================================================

/** Supabase minimum; keeping it here makes the rule visible in the form. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Turn a Supabase error into something a candidate can read, without turning
 * the form into an account-existence oracle ("already registered" is not
 * confirmed to the visitor).
 */
function friendlySignUpError(error) {
  const message = (error?.message || '').toLowerCase();

  if (message.includes('already registered') || message.includes('already exists')) {
    return 'We could not create an account with that email. If you already have one, please log in.';
  }
  if (message.includes('password')) {
    return `Please choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  return 'We could not create your account. Please try again.';
}

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /** All client-side validation in one place, so the rules are easy to defend. */
  function validate() {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmPassword) return 'The two passwords do not match.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const { session, error } = await signUp(email, password, fullName);

      if (error) {
        setErrorMessage(friendlySignUpError(error));
        setSubmitting(false);
        return;
      }

      if (session) {
        // Email confirmation is disabled for the demo, so the trigger has
        // already created the profiles row and the student is signed in.
        navigate('/', { replace: true });
        return;
      }

      // Email confirmation is enabled: the auth user exists, the profile row
      // appears when the link is opened.
      setSuccessMessage(
        'Account created. Check your inbox, confirm your email, then log in.',
      );
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSubmitting(false);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section className="register-page">
      <header className="page-header">
        <h1>Create a student account</h1>
        <p>Register once, then take any exam that is open for you.</p>
      </header>

      <span className="owner-badge">Owner: Ahmed Hany (member1)</span>

      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <div aria-live="polite">
          {errorMessage && <p className="alert alert-error register-error">{errorMessage}</p>}
          {successMessage && (
            <p className="alert alert-success register-error">{successMessage}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />
          <p className="form-hint">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <div className="form-group">
          <label htmlFor="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="register-actions">
          <button type="submit" className="btn register-submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
          <Link to="/login" className="register-link">
            I already have an account
          </Link>
        </div>
      </form>

      <p className="register-hint form-hint">
        New accounts are student accounts. Doctor and administrator roles are assigned by an
        administrator.
      </p>
    </section>
  );
}
