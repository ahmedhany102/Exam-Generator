import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { isSupabaseConfigured } from './lib/supabaseClient.js';

// Pages - each one is owned by exactly one team member (see README table).
import Login from './pages/Login.jsx'; //                       Member 1
import Register from './pages/Register.jsx'; //                 Member 1
import Profile from './pages/Profile.jsx'; //                   Member 1
import SecurityActivity from './pages/SecurityActivity.jsx'; // Member 1
import Jobs from './pages/Jobs.jsx'; //                         Member 2
import JobDetails from './pages/JobDetails.jsx'; //             Member 2
import Quiz from './pages/Quiz.jsx'; //                         Member 2
import Applying from './pages/Applying.jsx'; //                 Member 3
import MyApplications from './pages/MyApplications.jsx'; //     Member 3

// ============================================================================
// App.jsx - the single place where URLs are mapped to pages.
// ----------------------------------------------------------------------------
// Public pages  : /login, /register
// Protected     : everything else, wrapped in <ProtectedRoute> which redirects
//                 to /login when there is no active Supabase session.
//
// Adding a page later means: create the .jsx file, import it here, add one
// <Route>. Nothing else in the app needs to change.
// ============================================================================
export default function App() {
  return (
    <div className="app">
      <Navbar />

      {/* M0 helper: shown only until .env has real Supabase keys. */}
      {!isSupabaseConfigured && (
        <p className="config-warning">
          Supabase is not configured yet. Copy <code>frontend/.env.example</code> to{' '}
          <code>frontend/.env</code> and add your project URL and anon key.
        </p>
      )}

      <main className="app-main">
        <Routes>
          {/* ---------- Public routes ---------- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ---------- Protected routes ---------- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute>
                <JobDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/apply"
            element={
              <ProtectedRoute>
                <Applying />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <SecurityActivity />
              </ProtectedRoute>
            }
          />

          {/* Unknown URL -> send the visitor to the jobs feed. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        Candidate Portal - Web Development, AI &amp; Database course project
      </footer>
    </div>
  );
}
