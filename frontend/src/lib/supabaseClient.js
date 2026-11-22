import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Owner: Ahmed Hany (member1) - Team Lead, Database, Auth & Security
// File: lib/supabaseClient.js
// ----------------------------------------------------------------------------
// ONE Supabase client for the whole frontend.
//
// Why a single file: creating a client per page would open extra auth
// listeners and duplicate sessions. Every service (exams, attempts, results,
// grading, profile, security log) imports the same `supabase` object here.
//
// Supabase is the only backend of this system: Auth issues the JWT, Postgres
// stores profiles/exams/questions/attempts, and Row Level Security decides what
// each role may read or write. There is no second server and no API base URL.
//
// The two values come from frontend/.env (VITE_SUPABASE_*). Vite replaces
// import.meta.env.VITE_* at build time, so they are compiled into the bundle.
// That is safe ONLY because we use the anon public key: RLS, not secrecy, is
// what protects the data.
//
// The client is null when the keys are missing so the frontend can still start
// (with a warning banner) instead of crashing on a blank screen.
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when both environment variables were provided. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy frontend/.env.example to frontend/.env and restart the dev server.',
  );
}

/** The shared Supabase client (auth + database). */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
