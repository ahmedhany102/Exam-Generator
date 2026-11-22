import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: services/securityLogService.js
// ----------------------------------------------------------------------------
// Writes one row into the `security_logs` table: the audit trail that carries
// the security mark of the project. Every sign-in attempt, every exam
// submission and every blocked action must leave a trace the user can see on
// /security. The table is append-only - there is no UPDATE or DELETE policy.
//
// Table columns: user_email (text), event_type (text), details (text),
// created_at (timestamptz, default now()).
//
// Event types used by the whole team (keep the strings identical everywhere):
//   LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT
//   EXAM_STARTED  | EXAM_SUBMITTED
//   BLOCKED_ACTION   (a role tried to reach something it may not touch)
// ============================================================================

/**
 * Insert one security event.
 *
 * @param {object} event
 * @param {string} event.eventType  one of the constants listed above
 * @param {string} [event.details]  short human readable explanation
 * @param {string} [event.email]    the email involved; defaults to the
 *                                  signed-in user's email
 * @returns {Promise<{ error: Error|null }>} never throws - see the TODO note
 *
 * TODO(Ahmed Hany, member1 - Milestone M1):
 *   1. Fall back to supabase.auth.getUser() when event.email is empty.
 *   2. supabase.from('security_logs').insert({ user_email, event_type, details }).
 *   3. Swallow the error and return it instead of throwing: a failed log write
 *      must never block a sign-in or an exam submission. Comment why.
 *   4. Never log a password, an answer key or a JWT - only metadata.
 */
export async function logSecurityEvent({ eventType, details = '', email = '' } = {}) {
  void supabase;
  void eventType;
  void details;
  void email;

  throw new Error(
    'logSecurityEvent() is not implemented yet (Ahmed Hany - member1, Milestone M1).',
  );
}

/**
 * Read the signed-in user's own events, newest first.
 * RLS already limits the result to rows whose user_email matches the email in
 * the caller's JWT, so no .eq() filter is strictly required - adding it makes
 * the intention obvious during the code review.
 *
 * TODO(Ahmed Hany, member1 - Milestone M1): implement with
 *   supabase.from('security_logs').select('*').order('created_at', { ascending: false })
 */
export async function getMySecurityLogs() {
  throw new Error(
    'getMySecurityLogs() is not implemented yet (Ahmed Hany - member1, Milestone M1).',
  );
}
