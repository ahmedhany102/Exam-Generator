import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

// ============================================================================
// Entry point of the React frontend.
// ----------------------------------------------------------------------------
// The component tree is intentionally simple:
//
//   <BrowserRouter>       -> gives every page a real URL (/exams, /login, ...)
//     <AuthProvider>      -> loads the Supabase session + role ONCE for the app
//       <App />           -> the route table (see App.jsx)
//
// Keeping both providers here means a page never has to care where the session
// comes from: it just calls useAuth().
// ============================================================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
