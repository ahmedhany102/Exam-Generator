import './Register.css';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: pages/Register.jsx
// Route: /register   (public)
// ----------------------------------------------------------------------------
// Public registration creates STUDENT accounts only. That is a security rule,
// not a UI detail: doctor accounts are created by an admin (ManageUsers.jsx),
// and the role value never comes from the browser form. The signup trigger in
// database/01_schema.sql writes the profiles row with role = 'student'.
//
// TODO(Ahmed Hany, member1 - Milestone M1):
//   1. Inputs: full_name, email, password, confirm password.
//   2. Validate: password >= 8 characters, both passwords match, name not empty.
//   3. signUp(email, password, fullName) from AuthContext, which calls
//      supabase.auth.signUp with options.data.full_name.
//   4. The database trigger creates the profiles row - do not insert it here,
//      the two writes would race and one of them would fail.
//   5. Show "check your email", or sign the user in directly when email
//      confirmation is disabled for the demo (see PLAN.md section 6.1).
// ============================================================================
export default function Register() {
  return (
    <section className="register-page">
      <header className="page-header">
        <h1>Create a student account</h1>
        <p>Register once, then take any exam that is open for you.</p>
      </header>

      <span className="owner-badge">Owner: Ahmed Hany (member1)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <ul className="register-todo-list">
          <li>Full name, email, password, confirm password</li>
          <li>Password length + match validation</li>
          <li>supabase.auth.signUp with full_name in user metadata</li>
          <li>Student role forced by the database trigger, not by the form</li>
        </ul>
      </div>
    </section>
  );
}
