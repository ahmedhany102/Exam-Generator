import './Profile.css';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: pages/Profile.jsx
// Route: /profile   (protected)
// ----------------------------------------------------------------------------
// TODO(Member 1 - Milestone M1):
//   1. On mount: getProfile() -> fill full_name and job_title inputs.
//   2. Save button: updateProfile({ full_name, job_title }) and show a
//      success alert ("Profile updated").
//   3. CV section:
//        - <input type="file" accept="application/pdf" />
//        - validateCvFile(file) BEFORE uploading; on failure log
//          INVALID_FILE_BLOCKED and show the returned error message.
//        - uploadCv(file) -> stores "{user_id}/cv.pdf" in the private bucket
//          and the path in profiles.cv_url, then logs CV_UPLOADED.
//        - show "CV uploaded" plus the file name/date.
//   4. This page is also the gate for applying: without a CV the Apply button
//      on JobDetails sends the user here first.
// ============================================================================
export default function Profile() {
  return (
    <section className="profile-page">
      <header className="page-header">
        <h1>My Profile</h1>
        <p>Keep your details up to date and upload the PDF CV used by the AI analysis.</p>
      </header>

      <span className="owner-badge">Owner: Member 1 - Ahmed Hany</span>

      <div className="profile-grid">
        <div className="card">
          <h2>Personal details</h2>
          <div className="placeholder-note">
            <strong>Placeholder form (Milestone M0)</strong>
            <ul className="profile-todo-list">
              <li>Full name input</li>
              <li>Job title input</li>
              <li>Save button calling updateProfile()</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <h2>My CV (PDF, max 5 MB)</h2>
          <div className="placeholder-note">
            <strong>Placeholder uploader (Milestone M0)</strong>
            <ul className="profile-todo-list">
              <li>File input restricted to .pdf</li>
              <li>validateCvFile() before upload</li>
              <li>uploadCv() to the private "cvs" bucket</li>
              <li>INVALID_FILE_BLOCKED / CV_UPLOADED security logs</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
