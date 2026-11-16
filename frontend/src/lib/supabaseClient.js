import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: lib/supabaseClient.js
// ----------------------------------------------------------------------------
// ONE Supabase client for the whole frontend.
//
// Why a single file: creating a client per page would open extra auth
// listeners and duplicate sessions. Every service (jobs, applications,
// profile, security log) imports the same `supabase` object from here.
//
// The two values come from frontend/.env (VITE_supabase...). Vite replaces
// import.meta.env.VITE_* at build time, so they are compiled into the bundle.
// That is safe ONLY because we use the anon public key. Row Level Security in
// Postgres decides what that key is allowed to read or write.
//
// The client is set to null when the keys are missing so the application can
// still start (showing a warning) instead of crashing on a blank screen.
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

/** The shared Supabase client (auth + database + storage). */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Where the Python AI service runs. Also configurable through .env. */
export const AI_SERVICE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';
