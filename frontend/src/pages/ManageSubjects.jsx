import './ManageSubjects.css';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: pages/ManageSubjects.jsx
// Route: /admin/subjects   (admin)
// ----------------------------------------------------------------------------
// Subjects are what exams belong to, and only the admin may change them. The
// admin writes are protected by RLS as well: the admin policy on `subjects`
// is what actually allows the write, this page only provides the form.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. On mount: load the subjects with their doctor's name
//      (`.select('*, profiles(full_name)')`) plus the list of doctors for the
//      assignment dropdown (`profileService.listUsers({ role: 'doctor' })`).
//   2. Create form: name + code + optional doctor. Show the duplicate error
//      from `subjects.code` (Postgres code 23505) as "This code is already used".
//   3. Edit and delete per row. Deleting cascades to the subject's exams, so
//      ask for confirmation and say what will be deleted.
//   4. States: loading (Loader), empty ("No subjects yet"), error (.alert-error).
// ============================================================================
export default function ManageSubjects() {
  return (
    <section className="manage-subjects-page">
      <header className="page-header">
        <h1>Manage subjects</h1>
        <p>Create the subjects exams belong to and assign the doctor who teaches each one.</p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Abduljawad (member4)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="manage-subjects-todo-title">This page will contain:</p>
        <ul className="manage-subjects-todo-list">
          <li>A table of subjects: name, code, assigned doctor</li>
          <li>A create/edit form with duplicate-code handling</li>
          <li>A delete action that names what the cascade will remove</li>
          <li>Loading, empty and error states</li>
        </ul>
      </div>
    </section>
  );
}
