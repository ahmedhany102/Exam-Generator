import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: context/AuthContext.jsx
// ----------------------------------------------------------------------------
// A React Context is just a box that holds a value (here: the Supabase session)
// and lets any component read it with useAuth() - no prop drilling, no Redux.
//
// What is finished in this M0 skeleton:
//   - loading the session once when the app starts
//   - listening for login / logout / token refresh events
//   - signOut()
//
// TODO (Member 1, Milestone M1):
//   - signIn(email, password)  -> supabase.auth.signInWithPassword + LOGIN_SUCCESS
//                                  / LOGIN_FAILED row in security_logs
//   - signUp(email, password, fullName) -> supabase.auth.signUp
//   - call logSecurityEvent() on every attempt (see services/securityLogService.js)
// ============================================================================

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /** The Supabase session object, or null when the visitor is logged out. */
  const [session, setSession] = useState(null);
  /** true while we are still asking Supabase "is somebody logged in?". */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without .env keys there is nothing to ask, so we simply stop loading.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Read the session that Supabase already stored in localStorage.
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

    // 3. Clean up the listener when the provider unmounts (React best practice).
    return () => authListener.subscription.unsubscribe();
  }, []);

  /** Log out and let ProtectedRoute send the user back to /login. */
  async function signOut() {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signOut,
    // TODO(Member 1): add signIn and signUp here.
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
