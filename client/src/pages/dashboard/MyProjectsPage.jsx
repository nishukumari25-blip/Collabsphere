import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  PlusCircle,
  Search,
  Filter,
  Users,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { StatusBadge, VisibilityBadge, RoleBadge } from '../../components/Badge';
import { CardSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const MyProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [visibility, setVisibility] = useState('all');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjects({
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        visibility: visibility !== 'all' ? visibility : undefined
      });
      if (res.success) {
        setProjects(res.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProjects();
    }, 250);
    return () => clearTimeout(debounce);
  }, [search, status, visibility]);

  const getUserRole = (p) => {
    if (p.owner?._id === user?._id || p.owner === user?._id) return 'OWNER';
    const member = p.members?.find((m) => (m.user?._id || m.user) === user?._id);
    return member ? member.role : 'VIEWER';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">
            Manage your collaborative repositories, assign team roles, and track project documentation.
          </p>
        </div>
        <div className="page-actions">
          <NavLink to="/projects/new" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Create Project</span>
          </NavLink>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search projects by name, description, or tech stack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Visibility:</span>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="all">All</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title={search ? 'No matching projects found' : 'No projects yet'}
          description={
            search
              ? 'Try adjusting your search criteria or filter options.'
              : 'Create your first project to start organizing notes, uploading files, and collaborating.'
          }
          actionLabel={search ? undefined : 'Create Project'}
          onAction={search ? undefined : () => navigate('/projects/new')}
        />
      ) : (
        <div className="grid-3">
          {projects.map((p) => {
            const role = getUserRole(p);
            return (
              <div
                key={p._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => navigate(`/projects/${p._id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      lineHeight: 1.3
                    }}
                  >
                    {p.name}
                  </h3>
                  <RoleBadge role={role} />
                </div>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {p.description || 'No description provided.'}
                </p>

                {/* Tech Tags */}
                {p.technologies?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                    {p.technologies.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          backgroundColor: 'var(--bg-muted)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                    {p.technologies.length > 4 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        +{p.technologies.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-light)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={p.status} />
                    <VisibilityBadge visibility={p.visibility} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} />
                    <span>{p.members?.length || 1} members</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
