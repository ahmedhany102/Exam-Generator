import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Loader from './components/Loader.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { isSupabaseConfigured } from './lib/supabaseClient.js';

// Pages - each one is owned by exactly one team member (see README table).
// Shared / every role
import Login from './pages/Login.jsx'; //                        Ahmed Hany (member1)
import Register from './pages/Register.jsx'; //                  Ahmed Hany (member1)
import Profile from './pages/Profile.jsx'; //                    Ibrahim Lotfy (member2)
import SecurityActivity from './pages/SecurityActivity.jsx'; //   Ibrahim Abduljawad (member4)
// Student
import Exams from './pages/Exams.jsx'; //                        Ibrahim Lotfy (member2)
import ExamDetails from './pages/ExamDetails.jsx'; //            Ibrahim Lotfy (member2)
import TakeExam from './pages/TakeExam.jsx'; //                  Ibrahim Lotfy (member2)
import MyResults from './pages/MyResults.jsx'; //                Ibrahim Lotfy (member2)
// Doctor
import DoctorDashboard from './pages/DoctorDashboard.jsx'; //    Ahmed Fayez (member3)
import CreateExam from './pages/CreateExam.jsx'; //              Ahmed Fayez (member3)
import ManageExams from './pages/ManageExams.jsx'; //            Ahmed Fayez (member3)
import ExamResults from './pages/ExamResults.jsx'; //            Ahmed Fayez (member3)
// Admin
import AdminDashboard from './pages/AdminDashboard.jsx'; //      Ibrahim Abduljawad (member4)
import ManageUsers from './pages/ManageUsers.jsx'; //            Ibrahim Abduljawad (member4)
import ManageSubjects from './pages/ManageSubjects.jsx'; //      Ibrahim Abduljawad (member4)

// ============================================================================
// File: App.jsx   (SHARED - only Ahmed Hany, member1, changes this file)
// ----------------------------------------------------------------------------
// The one place where URLs are mapped to pages. Every other file just receives
// its route and renders; adding a page later means one import + one <Route>.
//
// The system has three roles, so the table below has four blocks:
//   public     : /login, /register
//   every role : /profile, /security
//   student    : /exams, /exams/:examId, /exams/:examId/take, /my-results
//   doctor     : /doctor/dashboard, /doctor/create-exam, /doctor/my-exams,
//                /doctor/exams/:examId/results
//   admin      : /admin/dashboard, /admin/users, /admin/subjects
//
// "/" is not a page: it reads the role from AuthContext and forwards the user
// to that role's dashboard (see <RoleRedirect>). Role checks are repeated on
// the server side by RLS - a hidden button is convenience, not security.
// ============================================================================

/** Where each role lands once it is signed in. One table, three call sites. */
const HOME_BY_ROLE = {
  student: '/exams',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};

/**
 * The "/" route: send the signed-in user to the dashboard of their role.
 *
 * `role` comes from AuthContext, which reads the role column of the signed-in
 * user's `profiles` row (Ahmed Hany, member1).
 *
 * If the role cannot be loaded (for example before the profiles table exists),
 * we show a small chooser instead of bouncing the user in a redirect loop, so
 * the M0 scaffold stays clickable during the course demo.
 */
function RoleRedirect() {
  const { role, loading } = useAuth();

  if (loading) {
    return <Loader message="Checking your role..." />;
  }

  if (!role) {
    return (
      <section className="card">
        <h1>Choose your area</h1>
        <p>
          Your role is not available yet. It is read from the <code>profiles</code> table by{' '}
          <code>context/AuthContext.jsx</code> (Ahmed Hany, member1).
        </p>
        <ul>
          <li>
            <a href="/exams">Student - available exams</a>
          </li>
          <li>
            <a href="/doctor/dashboard">Doctor - dashboard</a>
          </li>
          <li>
            <a href="/admin/dashboard">Admin - dashboard</a>
          </li>
        </ul>
      </section>
    );
  }

  return <Navigate to={HOME_BY_ROLE[role] ?? '/exams'} replace />;
}

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

          {/* ---------- Every signed-in role ---------- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRedirect />
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
            path="/security"
            element={
              <ProtectedRoute>
                <SecurityActivity />
              </ProtectedRoute>
            }
          />

          {/* ---------- Student routes ---------- */}
          <Route
            path="/exams"
            element={
              <ProtectedRoute allow={['student']}>
                <Exams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/:examId"
            element={
              <ProtectedRoute allow={['student']}>
                <ExamDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams/:examId/take"
            element={
              <ProtectedRoute allow={['student']}>
                <TakeExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-results"
            element={
              <ProtectedRoute allow={['student']}>
                <MyResults />
              </ProtectedRoute>
            }
          />

          {/* ---------- Doctor routes ---------- */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allow={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/create-exam"
            element={
              <ProtectedRoute allow={['doctor']}>
                <CreateExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/my-exams"
            element={
              <ProtectedRoute allow={['doctor']}>
                <ManageExams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/exams/:examId/results"
            element={
              <ProtectedRoute allow={['doctor']}>
                <ExamResults />
              </ProtectedRoute>
            }
          />

          {/* ---------- Admin routes ---------- */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allow={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allow={['admin']}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allow={['admin']}>
                <ManageSubjects />
              </ProtectedRoute>
            }
          />

          {/* Unknown URL -> let "/" pick the right dashboard for this role. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        Online Examination System - Web Development &amp; Database course project
      </footer>
    </div>
  );
}
