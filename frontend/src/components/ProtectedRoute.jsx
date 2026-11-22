import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: components/ProtectedRoute.jsx
// ----------------------------------------------------------------------------
// Three checks live here, so no page has to repeat them:
//
//   1. Is the session still loading?      -> Loader
//   2. Is somebody signed in?             -> otherwise /login, remembering the
//      page the user wanted (state.from, read back by Login.jsx)
//   3. Is that person allowed in here?    -> `allow` is a list of roles, e.g.
//      <ProtectedRoute allow={['doctor']}>
//
// The role question is only answered once roleLoading is false. While it is in
// flight we show the Loader, so a hard refresh never flashes a redirect based on
// a role that has not arrived yet.
//
// IMPORTANT, and a favourite defence question: this is a convenience layer for
// the UI only. The real rule is enforced by Row Level Security in Postgres - if
// a student forces their browser to render /admin/users, every query still
// returns nothing and every write is rejected.
// ============================================================================
export default function ProtectedRoute({ children, allow }) {
  const { user, role, roleLoading, loading } = useAuth();
  const location = useLocation();

  if (loading || (user && roleLoading)) {
    return <Loader message="Checking your session..." />;
  }

  if (!user) {
    // "state.from" is read by the Login page after a successful sign-in.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Strict now that the role is known: not allowed means back to the role's own
  // home page ("/" -> RoleRedirect). A null role (no profiles row, or a
  // deactivated account) also fails this check.
  if (allow && !allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
