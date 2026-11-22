import { Link } from 'react-router-dom';
import './AdminDashboard.css';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: pages/AdminDashboard.jsx
// Route: /admin/dashboard   (admin)
// ----------------------------------------------------------------------------
// The first screen after an admin signs in, and the only screen that answers
// "is this system ready to demo?" in one look: how many students, doctors,
// subjects and exams exist.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. On mount, fetch four counts (profiles per role, subjects, exams) - four
//      small head-count requests, no joins, because a dashboard number never
//      needs the rows themselves.
//   2. Render them in .admin-stat-grid as .admin-stat-card (label + value).
//   3. Keep the two links: /admin/users for members and roles, /admin/subjects
//      for subjects and the doctor assigned to each.
//   4. Warn when the doctor count is 0: no doctor means no exam can be authored,
//      and database/04_seed_exams.sql has no author to point at.
// ============================================================================
export default function AdminDashboard() {
  return (
    <section className="admin-dashboard-page">
      <header className="page-header">
        <h1>Admin dashboard</h1>
        <p>
          System-wide counters, plus the two screens only an admin may open: members and roles,
          and subjects.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Abduljawad (member4)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="admin-dashboard-todo-title">This page will contain:</p>
        <ul className="admin-dashboard-todo-list">
          <li>A students counter, from profiles where role = 'student'</li>
          <li>A doctors counter, from profiles where role = 'doctor'</li>
          <li>A subjects counter, from the subjects table</li>
          <li>An exams counter, from the exams table</li>
          <li>A warning row while no doctor account exists</li>
        </ul>
      </div>

      <nav className="admin-links" aria-label="Admin sections">
        <Link className="btn" to="/admin/users">
          Members and roles
        </Link>
        <Link className="btn btn-secondary" to="/admin/subjects">
          Subjects and doctors
        </Link>
      </nav>
    </section>
  );
}
