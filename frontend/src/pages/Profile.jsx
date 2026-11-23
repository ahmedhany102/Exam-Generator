import { useEffect, useState } from 'react';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { getProfile, updateProfile } from '../services/profileService.js';
import './Profile.css';

// ============================================================================
// Owner: Ibrahim Lotfy (member2) - Student Exams & Timed Exam
// File: pages/Profile.jsx
// Route: /profile   (protected, every role)
// ----------------------------------------------------------------------------
// The account page. It shows what the student is not allowed to change (email,
// role) and lets them change the one thing they own: their full name.
// ============================================================================
export default function Profile() {
  const { user, role: authRole } = useAuth();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfileData() {
      setLoading(true);
      setError(null);

      // Default values from current auth session
      setEmail(user?.email || '');
      setRole(authRole || 'student');

      try {
        const { data, error: profileErr } = await getProfile();
        if (cancelled) return;

        if (profileErr) {
          setError(profileErr.message);
        } else if (data) {
          if (data.email) setEmail(data.email);
          if (data.role) setRole(data.role);
          const name = data.full_name || '';
          setFullName(name);
          setSavedName(name);
        }
      } catch (err) {
        // Cross-owner dependency: profileService belongs to member4 (or member1).
        console.warn('profileService.getProfile threw (waiting for implementation):', err);

        // Fallback: direct read if supabase client is active
        if (supabase && user?.id) {
          try {
            const { data: directProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (!cancelled && directProfile) {
              if (directProfile.email) setEmail(directProfile.email);
              if (directProfile.role) setRole(directProfile.role);
              const name = directProfile.full_name || user?.user_metadata?.full_name || '';
              setFullName(name);
              setSavedName(name);
            }
          } catch {
            // Use metadata name as safe local fallback
            const fallbackName = user?.user_metadata?.full_name || '';
            setFullName(fallbackName);
            setSavedName(fallbackName);
          }
        } else {
          const fallbackName = user?.user_metadata?.full_name || '';
          setFullName(fallbackName);
          setSavedName(fallbackName);
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    fetchProfileData();

    return () => {
      cancelled = true;
    };
  }, [user, authRole]);

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed || trimmed === savedName.trim()) {
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await updateProfile({ full_name: trimmed });
      if (res?.error) {
        setSaveError(res.error.message || 'Failed to update profile');
      } else {
        setSavedName(trimmed);
        setFullName(trimmed);
        setSaveSuccess(true);
      }
    } catch (serviceErr) {
      // Fallback if updateProfile throws
      if (supabase && user?.id) {
        try {
          const { error: directErr } = await supabase
            .from('profiles')
            .update({ full_name: trimmed })
            .eq('id', user.id);

          if (directErr) {
            setSaveError(directErr.message);
          } else {
            setSavedName(trimmed);
            setFullName(trimmed);
            setSaveSuccess(true);
          }
        } catch (directCatchErr) {
          setSaveError(directCatchErr.message || 'Failed to update profile');
        }
      } else {
        setSaveError(serviceErr.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  }

  const isUnchanged = fullName.trim() === savedName.trim();
  const isEmpty = !fullName.trim();
  const isSaveDisabled = saving || isUnchanged || isEmpty;

  return (
    <section className="profile-page">
      <header className="page-header">
        <h1>My profile</h1>
        <p>
          Your account details. The email and the role are managed by the system;
          you can update how your name appears on your results.
        </p>
      </header>

      <span className="owner-badge">Owner: Ibrahim Lotfy (member2)</span>

      {loading ? (
        <Loader message="Loading profile..." />
      ) : (
        <div className="profile-card">
          <h2>Account Details</h2>

          {error && (
            <div
              className="alert alert-error"
              role="alert"
              style={{ marginBottom: 'var(--space-md)' }}
            >
              {error}
            </div>
          )}

          {saveSuccess && (
            <div
              className="alert alert-success"
              role="status"
              style={{ marginBottom: 'var(--space-md)' }}
            >
              Profile updated successfully.
            </div>
          )}

          {saveError && (
            <div
              className="alert alert-error"
              role="alert"
              style={{ marginBottom: 'var(--space-md)' }}
            >
              {saveError}
            </div>
          )}

          <div className="profile-identity">
            <div>
              <span className="exam-meta-label">Signed in as</span>
              <span className="profile-identity-value">{email || 'Not available'}</span>
            </div>
            <div>
              <span className="profile-role">{role || 'student'}</span>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                className="input profile-readonly"
                value={email}
                readOnly
              />
              <small
                style={{
                  display: 'block',
                  marginTop: 'var(--space-xs)',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.8rem',
                }}
              >
                The email address is your sign-in identity and cannot be edited.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="profile-fullname">Full Name</label>
              <input
                id="profile-fullname"
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setSaveSuccess(false);
                  setSaveError(null);
                }}
                placeholder="Enter your full name"
                disabled={saving}
              />
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaveDisabled}
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
