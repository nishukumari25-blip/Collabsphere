import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  PlusCircle,
  Sparkles,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { projectService } from '../../services/projectService';
import { StatusBadge, VisibilityBadge } from '../../components/Badge';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';

export const MainDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, projRes] = await Promise.all([
          analyticsService.getUserDashboardStats(),
          projectService.getProjects({ limit: 6 })
        ]);

        if (dashRes.success) setStats(dashRes.stats);
        if (projRes.success) setProjects(projRes.projects || []);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: '32px', width: '250px', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '18px', width: '380px' }} />
        </div>
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Developer'}! 👋</h1>
          <p className="page-subtitle">
            Here is what's happening across your collaborative workspaces today.
          </p>
        </div>
        <div className="page-actions">
          <NavLink to="/projects/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>New Project</span>
          </NavLink>
        </div>
      </div>

      {/* Real Metric Counters */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FolderGit2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {stats?.totalProjects ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Projects
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {stats?.ownedProjects ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Owned by You
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {stats?.totalContributions ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Your Contributions
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
              {stats?.totalAiRequests ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Gemini AI Queries
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects & Recent Timeline */}
      <div className="content-sidebar-grid">
        {/* Active Projects List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Your Projects</h2>
            <NavLink to="/projects" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View all ({projects.length})</span>
              <ArrowRight size={14} />
            </NavLink>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No projects yet"
              description="Get started by creating your first collaborative project workspace."
              actionLabel="Create Project"
              onAction={() => navigate('/projects/new')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {projects.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/projects/${p._id}`)}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                        {p.name}
                      </span>
                      <StatusBadge status={p.status} />
                      <VisibilityBadge visibility={p.visibility} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.description || 'No description provided.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                      <span>Members: {p.members?.length || 1}</span>
                      <span>•</span>
                      <span>Owner: {p.owner?.name}</span>
                    </div>
                  </div>
                  <NavLink
                    to={`/projects/${p._id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open
                  </NavLink>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Mini-Feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Recent Activity</h2>
            <Clock size={16} color="var(--text-muted)" />
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            {stats?.recentActivities?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                No recorded actions yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats?.recentActivities?.map((act) => (
                  <div key={act._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        marginTop: '6px',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {act.action.replace('_', ' ').toUpperCase()}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}> in </span>
                      <span style={{ fontWeight: 600 }}>{act.project?.name || 'Project'}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick AI Tools Card */}
          <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={18} color="#7c3aed" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#581c87', margin: 0 }}>
                Gemini 2.5 Quick Tools
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#6b21a8', lineHeight: 1.5, marginBottom: '1rem' }}>
              Use AI directly to explain complex algorithms, generate technical docs, or audit code quality.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <NavLink to="/ai/explain" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', backgroundColor: 'white' }}>
                ⚡ Explain Any Code
              </NavLink>
              <NavLink to="/ai/readme" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', backgroundColor: 'white' }}>
                📄 Generate Professional README
              </NavLink>
              <NavLink to="/ai/review" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', backgroundColor: 'white' }}>
                🛡️ AI Code Review
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
