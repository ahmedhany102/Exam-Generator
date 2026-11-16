import './Loader.css';

// ============================================================================
// Owner: Member 1 - Ahmed Hany (Database, Auth & Security)
// File: components/Loader.jsx
// ----------------------------------------------------------------------------
// One tiny spinner used everywhere we wait for the network (session check,
// jobs fetch, AI analysis, applications fetch). Using one shared component
// keeps the loading look identical on every page.
// ============================================================================
export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <span className="loader-text">{message}</span>
    </div>
  );
}
