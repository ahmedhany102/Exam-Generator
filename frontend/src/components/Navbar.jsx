import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: components/Navbar.jsx
// ----------------------------------------------------------------------------
// The persistent header shown on every page. It is also the simplest place to
// prove the auth state works: links change depending on whether useAuth()
// returns a user or null.
//
// TODO (Member 1): after implementing signIn/signUp in AuthContext, also show
// the user's full_name from the `profiles` table instead of the raw email.
// ============================================================================
export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Candidate<span>Portal</span>
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          {user ? (
            <>
              <NavLink to="/" end className="navbar-link">
                Jobs
              </NavLink>
              <NavLink to="/applications" className="navbar-link">
                My Applications
              </NavLink>
              <NavLink to="/security" className="navbar-link">
                Security Activity
              </NavLink>
              <NavLink to="/profile" className="navbar-link">
                Profile
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar-link">
                Login
              </NavLink>
              <NavLink to="/register" className="navbar-link">
                Register
              </NavLink>
            </>
          )}
        </nav>

        {user && (
          <div className="navbar-user">
            <span className="navbar-email" title={user.email}>
              {user.email}
            </span>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
