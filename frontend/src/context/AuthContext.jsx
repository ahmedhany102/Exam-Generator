import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getProfile } from '../services/profileService.js';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: context/AuthContext.jsx
// ----------------------------------------------------------------------------
// A React Context is just a box that holds values (here: the Supabase session
// and the user's role) and lets any component read them with useAuth().
// No prop drilling, no Redux - one provider, one hook.
//
// Finished in this M0 scaffold:
//   - load the session once when the app starts
//   - listen for sign in / sign out / token refresh
//   - load the role from the `profiles` row (used by App.jsx to pick a home
//     page and by ProtectedRoute for the allow-list)
//   - signOut()
//
// TODO(Ahmed Hany, member1 - Milestone M1):
//   1. signIn(email, password)  -> supabase.auth.signInWithPassword, then write
//      LOGIN_SUCCESS / LOGIN_FAILED into security_logs via logSecurityEvent().
//   2. signUp(email, password, fullName) -> supabase.auth.signUp with
//      options.data.full_name, and role 'student' hard-coded on the server side
//      by the signup trigger. A visitor must never be able to self-assign
//      'doctor' or 'admin'.
//   3. refreshRole() so an admin promotion takes effect without a full reload.
// ============================================================================

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /** The Supabase session object, or null when the visitor is signed out. */
  const [session, setSession] = useState(null);
  /** true while we are still asking Supabase "is somebody signed in?". */
  const [loading, setLoading] = useState(true);
  /** 'student' | 'doctor' | 'admin' | null - read from the profiles row. */
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Without .env keys there is nothing to ask, so we simply stop loading.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Read the session Supabase already stored in localStorage.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 2. Stay in sync afterwards: sign in, sign out, token refresh.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    // 3. Remove the listener when the provider unmounts (React best practice).
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Whenever the signed-in user changes, refresh the role.
  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!session?.user) {
        setRole(null);
        return;
      }

      try {
        // profileService belongs to Ibrahim Abduljawad (member4). While it is
        // still a stub it throws, which is why this is wrapped: a missing role
        // must never take the whole app down.
        const { data } = await getProfile();
        if (!cancelled) setRole(data?.role ?? null);
      } catch {
        if (!cancelled) setRole(null);
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [session]);

  /** Log out and let ProtectedRoute send the user back to /login. */
  async function signOut() {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  const value = {
    session,
    user: session?.user ?? null,
    role,
    loading,
    signOut,
    // TODO(Ahmed Hany, member1): add signIn, signUp and refreshRole here.
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth() - read the auth context from any component.
 * Throws a clear error if somebody forgets the <AuthProvider> wrapper.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used inside <AuthProvider>');
  }
  return context;
}
