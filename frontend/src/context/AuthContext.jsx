import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { getProfile } from '../services/profileService.js';
import { logSecurityEvent, SECURITY_EVENT_TYPES } from '../services/securityLogService.js';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: context/AuthContext.jsx
// ----------------------------------------------------------------------------
// A React Context is a box that holds the values every page needs - the Supabase
// session and the user's role - and hands them out through useAuth().
// One provider, one hook, no Redux.
//
// What this file owns (Milestone M1):
//   signIn(email, password)            -> sign in + audit LOGIN_SUCCESS/FAILED
//   signUp(email, password, fullName)  -> create the student account
//   signOut()                          -> sign out + audit LOGOUT
//   refreshRole()                      -> re-read the role (admin promotion)
//   session / user / role / loading    -> the values pages read
//
// Two security decisions worth defending in the review:
//   1. The role comes from the `profiles` table, never from the form or from
//      user metadata. The database trigger hard-codes 'student' at signup, so a
//      visitor cannot register as a doctor or an admin.
//   2. Every auth transition writes an audit row through logSecurityEvent(),
//      which never throws - a failed log must not block a sign-in.
// ============================================================================

const AuthContext = createContext(null);

/** Fields AuthContext reads for the role. Exposed for the admin screens. */
const ROLE_COLUMNS = 'role, is_active';

export function AuthProvider({ children }) {
  /** The Supabase session object, or null when the visitor is signed out. */
  const [session, setSession] = useState(null);
  /** true while we are still asking Supabase "is somebody signed in?". */
  const [loading, setLoading] = useState(true);
  /** 'student' | 'doctor' | 'admin' | null - read from the profiles row. */
  const [role, setRole] = useState(null);
  /** true while the role query is in flight (see ProtectedRoute). */
  const [roleLoading, setRoleLoading] = useState(false);

  // Keeps async role loads from writing state after the provider unmounted.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Read the role of the signed-in user and store it.
   *
   * @returns {Promise<string|null>} the role, so signIn() can return it too
   */
  const loadRole = useCallback(async () => {
    if (!supabase) return null;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      if (mountedRef.current) setRole(null);
      return null;
    }

    // 1. Preferred source: profileService.getProfile() (Ibrahim Abduljawad,
    //    member4). While that service is still an M0 stub it throws, so the
    //    call is guarded - a missing role must never take the app down.
    try {
      const { data, error } = await getProfile();
      if (!error && data) {
        const nextRole = data.role ?? null;
        if (mountedRef.current) setRole(nextRole);
        return nextRole;
      }
    } catch {
      // fall through to the bridge below
    }

    // 2. Temporary bridge (Ahmed Hany, member1): read the role directly so the
    //    role-based routing and the allow-lists work before member4's service
    //    lands. It selects two columns, never the whole row, and disappears as
    //    soon as getProfile() is implemented - TODO below.
    //    TODO(Ahmed Hany, member1): delete this block when member4 merges
    //    profileService.getProfile(), and remove the import above.
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(ROLE_COLUMNS)
        .eq('id', userId)
        .single();

      if (error) {
        if (mountedRef.current) setRole(null);
        return null;
      }

      // A deactivated account keeps its history but loses its session: the admin
      // closes an account with is_active = false, not by deleting rows.
      if (data?.is_active === false) {
        await supabase.auth.signOut();
        if (mountedRef.current) setRole(null);
        return null;
      }

      const nextRole = data?.role ?? null;
      if (mountedRef.current) setRole(nextRole);
      return nextRole;
    } catch {
      if (mountedRef.current) setRole(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Without .env keys there is nothing to ask, so we simply stop loading.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Read the session Supabase already stored in localStorage. This is what
    //    keeps a user signed in across a page refresh.
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

    // 3. Remove the listener when the provider unmounts.
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Whenever the signed-in user changes, refresh the role.
  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    let cancelled = false;
    setRoleLoading(true);

    // roleLoading exists so ProtectedRoute can show its Loader instead of
    // deciding on a role that is still null. Without it, a hard refresh would
    // briefly bounce the user to the "Choose your area" fallback.
    loadRole().finally(() => {
      if (!cancelled) setRoleLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session, loadRole]);

  /**
   * Sign in with email and password.
   *
   * The returned error is the raw Supabase error: the Login page turns it into
   * one generic message so the form never reveals whether an account exists.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ data: object|null, role: string|null, error: Error|null }>}
   */
  async function signIn(email, password) {
    if (!supabase) {
      return { data: null, role: null, error: new Error('Supabase is not configured.') };
    }

    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !password) {
      return { data: null, role: null, error: new Error('Email and password are required.') };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // The attempted email is passed explicitly: a failed sign-in has no session
      // yet, so the service cannot look the user up.
      await logSecurityEvent({
        eventType: SECURITY_EVENT_TYPES.LOGIN_FAILED,
        email: cleanEmail,
        details: error.message,
      });
      return { data: null, role: null, error };
    }

    await logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.LOGIN_SUCCESS,
      email: cleanEmail,
      details: 'Signed in from the login page',
    });

    // Resolve the role now so the caller can redirect immediately.
    const nextRole = await loadRole();
    return { data, role: nextRole, error: null };
  }

  /**
   * Register a STUDENT account.
   *
   * There is no INSERT into profiles here: the database trigger
   * handle_new_user() creates the row with role = 'student' in the same
   * transaction as the auth user. Doing it twice would race the trigger.
   *
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @returns {Promise<{ data: object|null, session: object|null, error: Error|null }>}
   */
  async function signUp(email, password, fullName) {
    if (!supabase) {
      return { data: null, session: null, error: new Error('Supabase is not configured.') };
    }

    const cleanEmail = (email || '').trim();
    const cleanName = (fullName || '').trim();

    if (!cleanEmail || !password) {
      return {
        data: null,
        session: null,
        error: new Error('Email and password are required.'),
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      // user_metadata.full_name is read by handle_new_user() to fill the profile.
      options: { data: { full_name: cleanName } },
    });

    if (error) {
      return { data: null, session: null, error };
    }

    // When email confirmation is disabled (the demo setting) signUp already
    // returns a session, so the user is signed in straight away.
    if (data?.session) {
      await logSecurityEvent({
        eventType: SECURITY_EVENT_TYPES.LOGIN_SUCCESS,
        email: cleanEmail,
        details: 'Student account created and signed in',
      });
      await loadRole();
    }

    return { data, session: data?.session ?? null, error: null };
  }

  /**
   * Log out. The audit row is written BEFORE the session disappears, because
   * afterwards there is no JWT to attribute it to.
   */
  async function signOut() {
    if (!supabase) return { error: null };

    await logSecurityEvent({
      eventType: SECURITY_EVENT_TYPES.LOGOUT,
      details: 'Signed out',
    });

    const { error } = await supabase.auth.signOut();
    setRole(null);
    return { error };
  }

  const value = {
    session,
    user: session?.user ?? null,
    role,
    roleLoading,
    loading,
    signIn,
    signUp,
    signOut,
    refreshRole: loadRole,
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
