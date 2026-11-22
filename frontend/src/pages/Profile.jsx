import './Profile.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/Profile.jsx
// Route: /profile   (protected, every role)
// ----------------------------------------------------------------------------
// The account page. It shows what the student is not allowed to change (email,
// role) and lets them change the one thing they own: their full name.
//
// There is NO file upload on this page and none is planned. The old version of
// this file offered one; this system keeps no files at all - Supabase is used for
// Auth and Postgres only, so there is no Storage bucket to upload to. If a future
// milestone needs an attachment, that is a new decision with a new bucket and its
// own RLS policy, not a hidden input here.
//
// The role comes from profiles.role and is written BY the database, never by this
// page: a form that could post its own role would let a student promote
// themselves. RLS refuses the update anyway, but the UI must not even offer it.
//
// TODO(Ibrahim Lotfy, member2 - Milestone M2):
//   1. On mount: getProfile() from services/profileService.js (Ahmed Hany,
//      member1) -> keep { email, role, full_name } in useState, with loading and
//      error states. Wrap the call in try/catch while his file is still a stub.
//   2. Email input: readOnly, plus a hint saying the email is the sign-in
//      identity and cannot be edited here.
//   3. Role: show it as a badge (.profile-role), never as an editable field.
//   4. Full name: one controlled input; disable Save while it is unchanged or
//      empty after trim(), so the page cannot store an empty name.
//   5. Save: await updateProfile({ full_name }); on success show
//      <div className="alert alert-success">, on error the message from the
//      returned error. profileService returns { error } and never throws.
//   6. Keep the saved name in a separate state value (`savedName`) so the
//      "nothing changed" check survives a failed save.
// ============================================================================
export default function Profile() {
  return (
    <section className="profile-page">
      <header className="page-header">
        <h1>My profile</h1>
        <p>
          Your account details. The email and the role are managed by the system;
          you can update how your name appears on your results.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="profile-todo-title">This page will contain:</p>
        <ul className="profile-todo-list">
          <li>A read-only email field, with a hint explaining why</li>
          <li>A role badge: student, doctor or admin</li>
          <li>An editable full name with a Save button</li>
          <li>A success or error alert after saving</li>
          <li>No file input anywhere: this system stores no files</li>
        </ul>
      </div>
    </section>
  );
}
