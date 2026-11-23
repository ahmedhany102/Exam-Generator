import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: pages/Login.jsx
// Route: /login   (public)
// ----------------------------------------------------------------------------
// One sign-in form for all three roles. This page never decides where to go
// next based on the role: it navigates to "/" (or to the page ProtectedRoute
// remembered) and App.jsx's RoleRedirect picks /exams, /doctor/dashboard or
// /admin/dashboard from AuthContext.
//
// Security choices visible in this file:
//   * Every failure shows the SAME message ("Email or password is incorrect"),
//     so the form cannot be used to discover which addresses have an account.
//   * The audit row is written by AuthContext.signIn(), not here, so a failed
//     sign-in is recorded even if this component unmounts.
//   * Nothing about the password is stored, logged or put in the URL.
// ============================================================================

/** One message for every failure - never "wrong password" vs "no such user". */
const GENERIC_ERROR = 'Email or password is incorrect.';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If ProtectedRoute redirected here, it stored the page the user wanted.
  const redirectTo = location.state?.from || '/';

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setErrorMessage(GENERIC_ERROR);
        setSubmitting(false);
        return;
      }

      // Keep the button disabled while the redirect happens, so a double click
      // cannot fire a second sign-in.
      navigate(redirectTo, { replace: true });
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section className="login-page">
      <header className="page-header">
        <h1>Login</h1>
        <p>Sign in to take your exams or to manage the ones you created.</p>
      </header>

      <span className="owner-badge">Owner: Ahmed Hany (member1)</span>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {/* aria-live announces the failure to a screen reader as it appears. */}
        <div aria-live="polite">
          {errorMessage && <p className="alert alert-error login-error">{errorMessage}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="login-actions">
          <button type="submit" className="btn login-submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
          <Link to="/register" className="login-link">
            Create an account
          </Link>
        </div>
      </form>

      <p className="login-hint form-hint">
        Students register here. Doctor accounts are created by an administrator.
      </p>
    </section>
  );
}
