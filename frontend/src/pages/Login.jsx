import './Login.css';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: pages/Login.jsx
// Route: /login   (public)
// ----------------------------------------------------------------------------
// One login page for all three roles. After a successful sign-in the app does
// not need to know the role here: App.jsx reads it from AuthContext and sends
// the user to /exams, /doctor/dashboard or /admin/dashboard.
//
// TODO(Ahmed Hany, member1 - Milestone M1):
//   1. Two controlled inputs (email, password) using useState.
//   2. On submit: signIn(email, password) from AuthContext.
//   3. On success: logSecurityEvent({ eventType: 'LOGIN_SUCCESS' }) then
//      navigate(location.state?.from || '/')  <- the page ProtectedRoute saved.
//   4. On failure: logSecurityEvent({ eventType: 'LOGIN_FAILED', details }) and
//      show ONE generic message ("Email or password is incorrect") so the form
//      never reveals whether an account exists.
//   5. Disable the button while the request runs; link to /register.
// ============================================================================
export default function Login() {
  return (
    <section className="login-page">
      <header className="page-header">
        <h1>Login</h1>
        <p>Sign in to take your exams or to manage the ones you created.</p>
      </header>

      <span className="owner-badge">Owner: Ahmed Hany (member1)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="login-todo-title">This page will contain:</p>
        <ul className="login-todo-list">
          <li>Email + password form with client-side validation</li>
          <li>Supabase signInWithPassword call (through AuthContext)</li>
          <li>LOGIN_SUCCESS / LOGIN_FAILED rows in security_logs</li>
          <li>Redirect to the dashboard of the signed-in user's role</li>
        </ul>
      </div>
    </section>
  );
}
