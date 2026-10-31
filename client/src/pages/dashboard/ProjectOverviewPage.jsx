import React, { useEffect, useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  Files,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  Calendar,
  Share2,
  Copy,
  Check,
  Target,
  ExternalLink,
  Plus
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, VisibilityBadge, RoleBadge } from '../../components/Badge';
import { DetailsSkeleton } from '../../components/LoadingSkeleton';

export const ProjectOverviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentProject, userRole, projectStats, loadProject, loadingProject, projectError } = useProject();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProject(id);
  }, [id, loadProject]);

  const handleCopyShareLink = () => {
    if (!currentProject?.publicShare?.shareToken) {
      toast.warning('Public sharing is currently disabled. Enable it in Project Settings.');
      return;
    }
    const url = `${window.location.origin}/share/${currentProject.publicShare.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public share URL copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  if (loadingProject) {
    return <DetailsSkeleton />;
  }

  if (projectError || !currentProject) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Failed to Load Project</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{projectError || 'Project not found'}</p>
        <button onClick={() => navigate('/projects')} className="btn btn-primary">
          Return to Projects
        </button>
      </div>
    );
  }

  const p = currentProject;
  const isPrivileged = ['OWNER', 'ADMIN'].includes(userRole);

  return (
    <div>
      {/* Top Banner / Actions */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 className="page-title">{p.name}</h1>
            <RoleBadge role={userRole} />
            <StatusBadge status={p.status} />
            <VisibilityBadge visibility={p.visibility} />
          </div>
          <p className="page-subtitle" style={{ maxWidth: '850px' }}>
            {p.description || 'No description provided.'}
          </p>
        </div>

        <div className="page-actions">
          {p.publicShare?.enabled && (
            <button onClick={handleCopyShareLink} className="btn btn-secondary">
              {copied ? <Check size={16} color="var(--success)" /> : <Share2 size={16} />}
              <span>{copied ? 'Copied Link!' : 'Share Public Link'}</span>
            </button>
          )}

          {isPrivileged && (
            <NavLink to={`/projects/${p._id}/settings`} className="btn btn-secondary">
              <Settings size={16} />
              <span>Settings</span>
            </NavLink>
          )}

          {['OWNER', 'ADMIN', 'MEMBER'].includes(userRole) && (
            <NavLink to={`/projects/${p._id}/notes/new`} className="btn btn-primary">
              <Plus size={16} />
              <span>Create Note</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div
          className="card"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onClick={() => navigate(`/projects/${p._id}/notes`)}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>{projectStats.notesCount}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROJECT NOTES</div>
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onClick={() => navigate(`/projects/${p._id}/files`)}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Files size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>{projectStats.filesCount}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>ATTACHED FILES</div>
          </div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
          onClick={() => navigate(`/projects/${p._id}/members`)}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>{p.members?.length || 1}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TEAM MEMBERS</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Team */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          {/* Goals and Architecture Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Target size={20} color="var(--primary)" />
              <h3 className="card-title" style={{ margin: 0 }}>Project Goals & Architecture</h3>
            </div>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {p.goals || 'No specific milestones or goals defined yet.'}
            </p>
          </div>

          {/* Tech Stack Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>Technologies & Stack</h3>
            {p.technologies?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No technologies listed.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {p.technologies.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.4rem 0.85rem',
                      backgroundColor: 'var(--bg-muted)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: 'var(--text-main)'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Launchpad */}
          <div className="card" style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#7c3aed" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#5b21b6', margin: 0 }}>
                  Gemini AI Project Suite
                </h3>
              </div>
              <span className="badge" style={{ backgroundColor: '#ede9fe', color: '#5b21b6' }}>
                Official GenAI SDK
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6d28d9', lineHeight: 1.5, marginBottom: '1rem' }}>
              Trigger automated technical documentation, algorithmic explanations, and README generation for this project.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <NavLink to="/ai/explain" className="btn btn-secondary btn-sm" style={{ backgroundColor: 'white' }}>
                Explain Code
              </NavLink>
              <NavLink to="/ai/docs" className="btn btn-secondary btn-sm" style={{ backgroundColor: 'white' }}>
                Generate Technical Docs
              </NavLink>
              <NavLink to="/ai/readme" className="btn btn-secondary btn-sm" style={{ backgroundColor: 'white' }}>
                Generate README.md
              </NavLink>
              <NavLink to="/ai/review" className="btn btn-secondary btn-sm" style={{ backgroundColor: 'white' }}>
                Code Quality Review
              </NavLink>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Members & Meta */}
        <div>
          {/* Members Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Team Members</h3>
              <NavLink to={`/projects/${p._id}/members`} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                Manage ({p.members?.length || 1})
              </NavLink>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {p.members?.map((m) => (
                <div key={m.user?._id || m.user} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
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
                        fontSize: '0.8rem'
                      }}
                    >
                      {m.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {m.user?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        @{m.user?.username}
                      </div>
                    </div>
                  </div>
                  <RoleBadge role={m.role} />
                </div>
              ))}
            </div>
          </div>

          {/* Project Details Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Metadata</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Created On:</span>
                <span style={{ fontWeight: 600 }}>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Activity:</span>
                <span style={{ fontWeight: 600 }}>{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
              {p.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Deadline:</span>
                  <span style={{ fontWeight: 600 }}>{new Date(p.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Public Share:</span>
                <span style={{ fontWeight: 600, color: p.publicShare?.enabled ? 'var(--success)' : 'var(--text-light)' }}>
                  {p.publicShare?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
