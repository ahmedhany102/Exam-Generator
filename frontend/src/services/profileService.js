import { supabase } from '../lib/supabaseClient.js';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: services/profileService.js
// ----------------------------------------------------------------------------
// Everything that touches the `profiles` table: the signed-in user reading and
// editing their own row, and the admin screens listing members and changing a
// role or the active flag.
//
// There is no file upload here and no Storage bucket anywhere in this system -
// the schema stores no uploaded files at all (database/01_schema.sql). The old
// storage helpers are gone, not renamed.
//
// profiles columns (authoritative): id, full_name, email,
// role 'student' | 'doctor' | 'admin', is_active, created_at.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. Return { data, error } from every function (never throw).
//   2. Keep updateProfile() below the RLS UPDATE policy: it may write full_name
//      and nothing else. role and is_active are admin-only on purpose.
//   3. Point AuthContext at getProfile() for the role, and treat a missing row
//      as "not signed in" rather than as an error banner.
// ============================================================================

/**
 * The signed-in user's own profiles row.
 *
 * AuthContext calls this right after sign-in to learn the role, which is what
 * every ProtectedRoute decision is based on.
 *
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   supabase.from('profiles').select('*').eq('id', user.id).single()
 */
export async function getProfile() {
  void supabase;

  throw new Error(
    'getProfile() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}

/**
 * Update the signed-in user's own display name.
 *
 * Only `full_name` is accepted: a user must not be able to send a role or an
 * is_active flag for themselves, and the UPDATE policy in database/02_rls.sql is
 * written on that same assumption.
 *
 * @param {{ full_name?: string }} updates
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   pick only full_name out of `updates`, then
 *   supabase.from('profiles').update({ full_name }).eq('id', user.id).select().single()
 */
export async function updateProfile(updates) {
  void supabase;
  void updates;

  throw new Error(
    'updateProfile() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}

/**
 * Admin listing of every profile, optionally narrowed to one role.
 *
 * @param {{ role?: 'student'|'doctor'|'admin' }} [options]
 * @returns {Promise<{ data: object[]|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   const query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
 *   if (role) query.eq('role', role)
 *   Only an admin passes the RLS SELECT policy here; anyone else gets [].
 */
export async function listUsers({ role } = {}) {
  void supabase;
  void role;

  throw new Error(
    'listUsers() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}

/**
 * Change one account's role (promote a student to doctor, or demote back).
 *
 * There is no "create a doctor" function: a doctor is an ordinary registration
 * that an admin then promotes, because creating auth users needs the
 * service_role key and that key must never reach the frontend bundle.
 *
 * @param {string} userId
 * @param {'student'|'doctor'|'admin'} role
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   supabase.from('profiles').update({ role }).eq('id', userId).select().single()
 *   RLS enforces "admin only": a non-admin UPDATE simply affects no row.
 */
export async function updateUserRole(userId, role) {
  void supabase;
  void userId;
  void role;

  throw new Error(
    'updateUserRole() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}

/**
 * Activate or deactivate one account.
 *
 * Deactivating beats deleting: attempts.exam_id and attempts.student_id point at
 * real rows, so deleting an account would destroy that student's exam history
 * (and their results for a doctor's exam). is_active keeps the history and only
 * closes the door.
 *
 * @param {string} userId
 * @param {boolean} isActive
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 *
 * TODO(Ibrahim Abduljawad, member4 - Milestone M4):
 *   supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)
 *     .select().single()
 *   The admin must not deactivate their own row - check in the page as well, so
 *   a stray click cannot lock the last admin out of /admin/users.
 */
export async function setUserActive(userId, isActive) {
  void supabase;
  void userId;
  void isActive;

  throw new Error(
    'setUserActive() is not implemented yet (Ibrahim Abduljawad - member4, Milestone M4).',
  );
}
