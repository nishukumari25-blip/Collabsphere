import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Bell, Sparkles, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { notificationService } from '../services/notificationService';

export const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (isMounted && res.success) {
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn-icon mobile-menu-btn"
          id="mobile-menu-btn"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div className="breadcrumb-trail">
          <NavLink to="/dashboard" style={{ color: 'var(--text-muted)' }}>Workspace</NavLink>
          {currentProject && (
            <>
              <span className="separator">/</span>
              <NavLink to={`/projects/${currentProject._id}`} className="current">
                {currentProject.name}
              </NavLink>
            </>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick AI button */}
        <NavLink
          to="/ai/explain"
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'var(--primary-border)' }}
        >
          <Sparkles size={14} color="var(--primary)" />
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Gemini AI</span>
        </NavLink>

        {/* Notifications Icon with Badge */}
        <NavLink
          to="/notifications"
          className="btn-icon"
          style={{ position: 'relative' }}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--danger)',
                borderRadius: '50%'
              }}
            />
          )}
        </NavLink>

        {/* User Mini Avatar */}
        <NavLink to="/profile" title={user?.name || 'Profile'}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '1px solid var(--primary-border)'
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </NavLink>
      </div>
    </header>
  );
};
