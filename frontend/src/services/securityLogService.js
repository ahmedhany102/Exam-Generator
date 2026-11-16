import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: services/securityLogService.js
// ----------------------------------------------------------------------------
// Writes one row into the `security_logs` table. This is the "audit trail"
// part of the security mark: every login attempt, every CV upload and every
// blocked file must leave a trace that the user can see on /security.
//
// Table columns: user_email (text), event_type (text), details (text),
// created_at (timestamptz, default now()).
//
// Event types used by the team (keep them identical everywhere):
//   LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT
//   CV_UPLOADED   | INVALID_FILE_BLOCKED
// ============================================================================

/**
 * Insert one security event.
 *
 * @param {object} event
 * @param {string} event.eventType  one of the constants above
 * @param {string} [event.details]  short human readable explanation
 * @param {string} [event.email]    the email involved; defaults to the
 *                                  currently logged-in user's email
 * @returns {Promise<{ error: Error|null }>}
 *
 * TODO(Member 1 - Milestone M1):
 *   1. Fall back to supabase.auth.getUser() when event.email is missing.
 *   2. supabase.from('security_logs').insert({...}).
 *   3. Never log the password or the whole CV content - only metadata.
 */
export async function logSecurityEvent({ eventType, details = '', email = '' } = {}) {
  void supabase;
  void eventType;
  void details;
  void email;

  throw new Error(
    'logSecurityEvent() is not implemented yet (Member 1 - Ahmed Hany, Milestone M1).',
  );
}

/**
 * Read the logged-in user's own events, newest first.
 * RLS already limits the result to rows where
 * user_email = auth.jwt() ->> 'email', so no .eq() filter is required -
 * but adding it makes the intent obvious in the code review.
 *
 * TODO(Member 1 - Milestone M1): implement with
 *   supabase.from('security_logs').select('*').order('created_at', { ascending: false })
 */
export async function getMySecurityLogs() {
  throw new Error(
    'getMySecurityLogs() is not implemented yet (Member 1 - Ahmed Hany, Milestone M1).',
  );
}
