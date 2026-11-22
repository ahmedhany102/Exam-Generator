import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: components/ProtectedRoute.jsx
// ----------------------------------------------------------------------------
// Two checks live here, so no page has to repeat them:
//
//   1. Is somebody signed in?  -> otherwise redirect to /login and remember the
//      page they wanted, so Login.jsx can send them back afterwards.
//   2. Is that person allowed to see this area? -> the `allow` prop is a list of
//      roles, e.g. <ProtectedRoute allow={['doctor']}>.
//
// IMPORTANT, and a favourite defence question: this is a convenience layer for
// the UI only. The real rule is enforced by Row Level Security in Postgres -
// if a student forces their browser to render /admin/users, every query still
// returns nothing and every write is rejected.
//
// TODO(Ahmed Hany, member1 - Milestone M1): once the role lookup is live, block
// unknown roles too (today `role === null` means "not loaded yet", so the
// allow-list is skipped rather than locking the user out of their own pages).
// ============================================================================
export default function ProtectedRoute({ children, allow }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Checking your session..." />;
  }

  if (!user) {
    // "state.from" is read by the Login page after a successful sign-in.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Role known but not allowed for this route -> back to the role's home page.
  if (allow && role && !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
