import './Login.css';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: pages/Login.jsx
// Route: /login   (public)
// ----------------------------------------------------------------------------
// TODO(Member 1 - Milestone M1):
//   1. Two controlled inputs (email, password) using useState.
//   2. On submit: supabase.auth.signInWithPassword({ email, password }).
//   3. On success: logSecurityEvent({ eventType: 'LOGIN_SUCCESS' }) and then
//      navigate(location.state?.from || '/')  <-- the page ProtectedRoute saved.
//   4. On failure: logSecurityEvent({ eventType: 'LOGIN_FAILED', details }) and
//      show ONE generic message ("Invalid email or password") so the form never
//      reveals whether an account exists.
//   5. Disable the submit button while the request runs; link to /register.
// ============================================================================
export default function Login() {
  return (
    <section className="login-page">
      <header className="page-header">
        <h1>Login</h1>
        <p>Sign in to browse jobs and apply with your CV.</p>
      </header>

      <span className="owner-badge">Owner: Member 1 - Ahmed Hany</span>

      <div className="placeholder-note">
        <strong>Placeholder page (Milestone M0)</strong>
        <p className="login-todo-title">This page will contain:</p>
        <ul className="login-todo-list">
          <li>Email + password form with client-side validation</li>
          <li>Supabase signInWithPassword call</li>
          <li>LOGIN_SUCCESS / LOGIN_FAILED rows in security_logs</li>
          <li>Redirect back to the page the user tried to open</li>
        </ul>
      </div>
    </section>
  );
}
