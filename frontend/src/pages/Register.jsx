import './Register.css';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: pages/Register.jsx
// Route: /register   (public)
// ----------------------------------------------------------------------------
// TODO(Member 1 - Milestone M1):
//   1. Inputs: full_name, email, password, confirm password.
//   2. Validate: password >= 8 characters and both passwords match.
//   3. supabase.auth.signUp({ email, password, options: { data: { full_name } } })
//      The database trigger (database/01_schema.sql) creates the matching
//      profiles row automatically, so no second insert is needed here.
//   4. Show a "check your email" message, or log the user straight in when
//      email confirmation is disabled for the demo (see PLAN.md step 6).
//   5. Link to /login.
// ============================================================================
export default function Register() {
  return (
    <section className="register-page">
      <header className="page-header">
        <h1>Create an account</h1>
        <p>Register once, then upload a CV and apply for any job.</p>
      </header>

      <span className="owner-badge">Owner: Member 1 - Ahmed Hany</span>

      <div className="placeholder-note">
        <strong>Placeholder page (Milestone M0)</strong>
        <ul className="register-todo-list">
          <li>Full name, email, password, confirm password</li>
          <li>Password length + match validation</li>
          <li>supabase.auth.signUp with full_name in user metadata</li>
          <li>Profiles row created by the database trigger</li>
        </ul>
      </div>
    </section>
  );
}
