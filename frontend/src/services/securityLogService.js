import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: services/securityLogService.js
// ----------------------------------------------------------------------------
// The audit trail. Every sign-in attempt, exam start, exam submission and
// blocked action writes one row into `security_logs`, which the user can read
// back on /security. The table is append-only: 02_rls.sql defines no UPDATE and
// no DELETE policy, so nobody - not even an admin - can rewrite history.
//
// Two rules make this file safe to call from anywhere:
//   1. It NEVER throws. A failing log write must not block a sign-in, a sign-up
//      or an exam submission - the exam matters more than the audit line.
//   2. It NEVER records a password, a JWT or an answer key. Only the event type,
//      a short explanation and the email involved.
// ============================================================================

/**
 * The event vocabulary. Keep these strings identical in every file that logs,
 * because the security_logs INSERT policy in 02_rls.sql accepts exactly these
 * values (anything else is rejected by the WITH CHECK clause).
 */
export const SECURITY_EVENT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  EXAM_STARTED: 'EXAM_STARTED',
  EXAM_SUBMITTED: 'EXAM_SUBMITTED',
  BLOCKED_ACTION: 'BLOCKED_ACTION',
};

/** The details column is capped by the policy to 500 characters. */
const MAX_DETAILS_LENGTH = 500;

/** Trim a message so a database error can never break the insert policy. */
function trimDetails(details) {
  const text = typeof details === 'string' ? details.trim() : '';
  return text.length > MAX_DETAILS_LENGTH ? `${text.slice(0, MAX_DETAILS_LENGTH - 1)}…` : text;
}

/**
 * Write one security event.
 *
 * @param {object} event
 * @param {string} event.eventType  one of SECURITY_EVENT_TYPES
 * @param {string} [event.details]  short human readable explanation
 * @param {string} [event.email]    the email involved. Required for LOGIN_FAILED
 *                                  (no session yet); otherwise the signed-in
 *                                  user's email is used automatically.
 * @returns {Promise<{ error: Error|null }>} resolves with the error instead of
 *          throwing, so callers can ignore the result safely.
 */
export async function logSecurityEvent({ eventType, details = '', email = '' } = {}) {
  // Without a configured client there is nowhere to write; stay silent.
  if (!supabase) {
    return { error: null };
  }

  if (!eventType) {
    return { error: new Error('logSecurityEvent: eventType is required') };
  }

  try {
    let userEmail = (email || '').trim();

    // A failed sign-in happens before a session exists, so the caller has to
    // pass the attempted email. For everything else we ask Supabase who is
    // signed in - never the password, only the address.
    if (!userEmail) {
      const { data } = await supabase.auth.getUser();
      userEmail = data?.user?.email ?? '';
    }

    // No email means there is nobody to attribute the event to. Writing an
    // unattributable row would only pollute the audit log.
    if (!userEmail) {
      return { error: null };
    }

    const { error } = await supabase.from('security_logs').insert({
      user_email: userEmail,
      event_type: eventType,
      details: trimDetails(details),
    });

    if (error) {
      // Login must not fail because the audit insert failed. Log to the console
      // for the developer and hand the error back for optional inspection.
      console.warn('[securityLogService] could not write audit row:', error.message);
    }

    return { error: error ?? null };
  } catch (error) {
    console.warn('[securityLogService] unexpected audit failure:', error?.message ?? error);
    return { error };
  }
}

/**
 * Read the signed-in user's own events, newest first.
 *
 * RLS already limits the rows to those whose user_email equals the email in the
 * caller's JWT (security_logs_select_own). The explicit .eq() below is redundant
 * for security but makes the intent obvious during the code review - and it keeps
 * the query correct if the policy is ever tightened or loosened.
 *
 * @param {{ limit?: number }} [options]
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 */
export async function getMySecurityLogs({ limit = 100 } = {}) {
  if (!supabase) {
    return { data: [], error: null };
  }

  const { data: userData } = await supabase.auth.getUser();
  const email = userData?.user?.email ?? '';

  if (!email) {
    return { data: [], error: null };
  }

  // Explicit column list: the page renders date, event and details only.
  const { data, error } = await supabase
    .from('security_logs')
    .select('id, user_email, event_type, details, created_at')
    .eq('user_email', email)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: null, error };
  }

  return { data: data ?? [], error: null };
}
