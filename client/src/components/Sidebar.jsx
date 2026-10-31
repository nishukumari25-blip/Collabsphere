import React from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  PlusCircle,
  FileText,
  Files,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  History,
  Bell,
  Code2,
  FileCode,
  LogOut,
  ChevronRight,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { RoleBadge } from './Badge';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { currentProject, userRole } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pId = currentProject?._id;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="brand-logo" onClick={onClose}>
          <div className="brand-icon-box">
            <Sparkles size={18} />
          </div>
          <span>CollabSphere</span>
        </NavLink>
      </div>

      <div className="sidebar-scroll">
        {/* Current Project Context Card */}
        {currentProject && (
          <div className="sidebar-project-picker">
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
              Active Project
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '130px'
                }}
              >
                {currentProject.name}
              </span>
              <RoleBadge role={userRole} />
            </div>
          </div>
        )}

        {/* Global Navigation */}
        <div>
          <div className="nav-section-title">Workspace</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/projects" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FolderGit2 size={18} />
              <span>My Projects</span>
            </NavLink>
            <NavLink to="/projects/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <PlusCircle size={18} />
              <span>Create Project</span>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <Bell size={18} />
              <span>Notifications</span>
            </NavLink>
          </div>
        </div>

        {/* Active Project Navigation */}
        {pId && (
          <div>
            <div className="nav-section-title">Project Tools</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <NavLink to={`/projects/${pId}`} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <BookOpen size={18} />
                <span>Overview</span>
              </NavLink>
              <NavLink to={`/projects/${pId}/notes`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <FileText size={18} />
                <span>Markdown Notes</span>
              </NavLink>
              <NavLink to={`/projects/${pId}/files`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Files size={18} />
                <span>Project Files</span>
              </NavLink>
              <NavLink to={`/projects/${pId}/members`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={18} />
                <span>Team Members</span>
              </NavLink>
              <NavLink to={`/projects/${pId}/analytics`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <BarChart3 size={18} />
                <span>Analytics</span>
              </NavLink>
              <NavLink to={`/projects/${pId}/timeline`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <History size={18} />
                <span>Activity Timeline</span>
              </NavLink>
              {['ADMIN', 'OWNER'].includes(userRole) && (
                <NavLink to={`/projects/${pId}/settings`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                  <Settings size={18} />
                  <span>Project Settings</span>
                </NavLink>
              )}
            </div>
          </div>
        )}

        {/* Gemini AI Suite */}
        <div>
          <div className="nav-section-title">Gemini AI Studio</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <NavLink to="/ai/editor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <Code2 size={18} />
              <span>Code Snippets</span>
            </NavLink>
            <NavLink to="/ai/explain" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <Sparkles size={18} />
              <span>Code Explainer</span>
            </NavLink>
            <NavLink to="/ai/docs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FileCode size={18} />
              <span>Docs Generator</span>
            </NavLink>
            <NavLink to="/ai/readme" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <FileText size={18} />
              <span>README Generator</span>
            </NavLink>
            <NavLink to="/ai/review" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
              <CheckSquare size={18} />
              <span>AI Code Review</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              @{user?.username}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <NavLink to="/profile" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={onClose}>
            Profile
          </NavLink>
          <NavLink to="/settings" className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={onClose}>
            Settings
          </NavLink>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out" style={{ padding: '0.35rem 0.5rem' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
