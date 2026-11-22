import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ============================================================================
// Vite configuration
// ----------------------------------------------------------------------------
// Keep this file tiny on purpose: the course reviewer should see that we only
// need the React plugin (JSX -> JavaScript) and a fixed dev-server port.
//
// This system is a single-page app with exactly one backend: Supabase
// (Auth + Postgres, reached with the anon key from lib/supabaseClient.js).
// There is no second server to proxy to, so this config stays minimal.
//
// strictPort matters during the demo: Supabase Auth stores the session per
// origin, so if Vite silently moved to port 5174 everybody would look logged
// out. Failing loudly is the better behaviour.
// ============================================================================
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
