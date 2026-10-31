import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sparkles, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Header */}
      <header
        style={{
          height: '68px',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2.5rem'
        }}
      >
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
          <div className="brand-icon-box">
            <Sparkles size={20} />
          </div>
          <span>CollabSphere</span>
        </NavLink>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated ? (
            <NavLink to="/dashboard" className="btn btn-primary">
              Go to Workspace
            </NavLink>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-secondary">
                Log In
              </NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Get Started Free
              </NavLink>
            </>
          )}
        </nav>
      </header>

      {/* Main Public Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'white',
          padding: '2rem 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} CollabSphere — Enterprise AI Developer Platform.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <span>Powered by Gemini 2.5 & Google GenAI SDK</span>
          <span>BCA Capstone Project</span>
        </div>
      </footer>
    </div>
  );
};
