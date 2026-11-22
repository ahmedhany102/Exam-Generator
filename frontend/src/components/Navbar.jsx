import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

// ============================================================================
// Owner: Ahmed Fayez (member3) - Doctor Dashboard & Exam Creation
// File: components/Navbar.jsx
// ----------------------------------------------------------------------------
// The header shown on every page. AuthContext already resolved the session and
// the role, so this is the cheapest place to prove the role system works: the
// menu is one table with one row per role, and no role ever sees another
// role's links.
//
// Hiding a link is convenience, not security: the tables are protected by the
// RLS policies in database/02_rls.sql (Ahmed Hany, member1), so a student who
// types /doctor/dashboard by hand is still refused by ProtectedRoute AND by
// the database. Say that out loud during the defence.
//
// TODO(Ahmed Fayez, member3 - Milestone M3):
//   1. Show the full name from the `profiles` row next to the email once
//      getProfile() (member1) stops throwing; keep the email in the `title`
//      attribute so the reviewer can still see which account is signed in.
//   2. Keep "My exams" highlighted while a results page is open: add a second
//      NavLink for /doctor/exams that also gets .active on the nested route.
//   3. Announce the role change after sign-in with an aria-live region, so a
//      screen reader says "signed in as doctor" instead of silently swapping
//      the menu.
//   4. Collapse the links behind a toggle below 640px if the doctor menu ever
//      grows past one line; the current five links still fit.
// ============================================================================

/** Links every signed-in role shares: Profile and Security are open to all. */
const SHARED_LINKS = [
  { to: '/profile', label: 'Profile' },
  { to: '/security', label: 'Security' },
];

/**
 * One row per role. Adding a page means adding one entry here - never an
 * if/else chain inside JSX, where it would be easy to forget a role.
 */
const LINKS_BY_ROLE = {
  student: [
    { to: '/exams', label: 'Exams' },
    { to: '/my-results', label: 'My Results' },
    ...SHARED_LINKS,
  ],
  doctor: [
    { to: '/doctor/dashboard', label: 'Dashboard' },
    { to: '/doctor/create-exam', label: 'Create exam' },
    { to: '/doctor/my-exams', label: 'My exams' },
    ...SHARED_LINKS,
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/subjects', label: 'Subjects' },
    ...SHARED_LINKS,
  ],
};

/** A visitor gets only the two public routes. */
const PUBLIC_LINKS = [
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
];

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  // `role` stays null for a moment after sign-in while the profiles row loads.
  // Showing the public menu then would flash "Login" at a signed-in student,
  // so fall back to the links every role shares.
  const links = user ? (LINKS_BY_ROLE[role] ?? SHARED_LINKS) : PUBLIC_LINKS;

  async function handleLogout() {
    await signOut();
    // replace: true keeps the signed-out page out of the back-button history.
    navigate('/login', { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Online<span>Exam</span>
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="navbar-link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="navbar-user">
            <span className="navbar-email" title={user.email}>
              {user.email}
            </span>
            {role && (
              <span className="navbar-role" title="Your role in the system">
                {role}
              </span>
            )}
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
