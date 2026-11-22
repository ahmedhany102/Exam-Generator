import './ManageUsers.css';

// ============================================================================
// Owner: Ibrahim Abduljawad (member4) - Automatic Grading + Admin + Seed Data
// File: pages/ManageUsers.jsx
// Route: /admin/users   (admin)
// ----------------------------------------------------------------------------
// The admin's member list: who exists, what role they hold, and whether the
// account is still allowed in. Role and is_active are the two columns a browser
// could otherwise use to grant itself powers, so both changes are admin-only in
// RLS (database/02_rls.sql) and both are visible here.
//
// TODO(Ibrahim Abduljawad, member4 - Milestone M4):
//   1. On mount: profileService.listUsers({ role }) -> rows newest first.
//   2. Render <table class="users-table">: name, email, role badge, active
//      state, actions.
//   3. Role filter: a <select> calling listUsers({ role }) again (or filtering
//      the loaded rows for a small class list - one rule, stated in a comment).
//   4. Promote/demote with updateUserRole(); activate/deactivate with
//      setUserActive(). Reload the row on success, show .alert-error on failure.
//   5. Never render a promote button for your own row, and never let the last
//      admin demote or deactivate themselves.
// ============================================================================
export default function ManageUsers() {
  return (
    <section className="users-page">
      <header className="page-header">
        <h1>Members and roles</h1>
        <p>
          Every registered account, its role, and whether it may still sign in. Changing a role
          or closing an account is an admin action, enforced by row level security as well as by
          this page.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Abduljawad (member4)</span>

      <div className="placeholder-note">
        <strong>Placeholder page - Milestone M0</strong>
        <p className="users-todo-title">This page will contain:</p>
        <ul className="users-todo-list">
          <li>A table of profiles: name, email, role, active</li>
          <li>A role filter (all / student / doctor / admin)</li>
          <li>Promote and demote buttons calling updateUserRole()</li>
          <li>Activate and deactivate buttons calling setUserActive()</li>
          <li>A confirmation step before closing an account</li>
        </ul>
      </div>

      <div className="alert alert-info users-note">
        <strong>How a doctor account is created</strong>
        <p>
          A doctor registers on the normal register page once, exactly like a student, and an
          admin then promotes that account to doctor from this list. Creating sign-in accounts
          from the browser is not possible on purpose: it needs the service_role key, and a key
          with that power must never be shipped in a front-end bundle, where any visitor could
          read it from the dev tools and bypass every policy in the project.
        </p>
        <p>
          Deactivating is preferred over deleting for the same kind of reason: exam attempts point
          at real accounts, so deleting one would destroy that member&apos;s exam history. A closed
          account keeps its rows and cannot sign in.
        </p>
      </div>
    </section>
  );
}
