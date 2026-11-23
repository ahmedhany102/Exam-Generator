import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
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
// Role-aware links, nested doctor-results highlighting, profile identity, and
// the responsive menu are handled here.
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
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setProfileName('');
    setProfileError('');
    if (!user) {
      return undefined;
    }
    if (!supabase) {
      setProfileName('');
      setProfileError('Supabase is not configured.');
      return undefined;
    }

    async function loadProfileName() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!cancelled) setProfileName(data?.full_name?.trim() || '');
      } catch (error) {
        if (!cancelled) {
          setProfileName('');
          setProfileError(error?.message || 'Could not load your profile name.');
        }
      }
    }
    loadProfileName();
    return () => { cancelled = true; };
  }, [user]);

  // `role` stays null for a moment after sign-in while the profiles row loads.
  // Showing the public menu then would flash "Login" at a signed-in student,
  // so fall back to the links every role shares.
  const links = user ? (LINKS_BY_ROLE[role] ?? SHARED_LINKS) : PUBLIC_LINKS;

  async function handleLogout() {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    setLogoutError('');
    let signedOut = false;
    try {
      const result = await signOut();
      if (!result || result.error) {
        setLogoutError(result?.error?.message || 'You could not be signed out. Please try again.');
      } else {
        signedOut = true;
      }
    } catch (error) {
      setLogoutError(error?.message || 'You could not be signed out. Please try again.');
    } finally {
      loggingOutRef.current = false;
      setLoggingOut(false);
    }
    if (signedOut) {
      // replace: true keeps the signed-out page out of the back-button history.
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Online<span>Exam</span>
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>

        <nav
          id="main-navigation"
          className={`navbar-links${menuOpen ? ' navbar-links--open' : ''}`}
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to !== '/doctor/my-exams'}
              className={({ isActive }) =>
                `navbar-link${isActive || (
                  link.to === '/doctor/my-exams'
                  && location.pathname.startsWith('/doctor/exams/')
                ) ? ' active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="navbar-user">
            <span
              className="navbar-email"
              title={profileName ? `${profileName} - ${user.email}` : user.email}
            >
              {profileName || user.email}
            </span>
            {role && (
              <span className="navbar-role" title="Your role in the system">
                {role}
              </span>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Signing out...' : 'Log out'}
            </button>
          </div>
        )}
        {profileError && <p className="navbar-error" role="status">{profileError}</p>}
        {logoutError && <p className="navbar-error" role="alert">{logoutError}</p>}
      </div>
    </header>
  );
}
