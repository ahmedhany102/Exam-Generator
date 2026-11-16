import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from './Loader.jsx';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: components/ProtectedRoute.jsx
// ----------------------------------------------------------------------------
// Security requirement: no page that shows personal data may render for a
// visitor without a session. Instead of repeating an if-check in every page,
// each protected route in App.jsx is wrapped with this component.
//
// Three possible states:
//   1. loading      -> show a spinner (we do not know yet)
//   2. no session   -> redirect to /login and remember where the user wanted
//                      to go, so Login.jsx can send them back afterwards
//   3. has session  -> render the page untouched
// ============================================================================
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Checking your session..." />;
  }

  if (!user) {
    // "state.from" is read by the Login page after a successful sign-in.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
