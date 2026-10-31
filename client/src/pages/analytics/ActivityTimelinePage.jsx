import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  History,
  Filter,
  FileText,
  Files,
  Users,
  Sparkles,
  FolderGit2,
  Share2,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';

export const ActivityTimelinePage = () => {
  const { id: projectId } = useParams();
  const { currentProject, loadProject } = useProject();
  const toast = useToast();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getProjectActivities(projectId, {
        entityType: entityType !== 'all' ? entityType : undefined,
        page,
        limit: 30
      });
      if (res.success) {
        setActivities(res.activities || []);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load project activity timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [projectId, entityType, page]);

  useEffect(() => {
    if (!currentProject || currentProject._id !== projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const getActivityIcon = (entity) => {
    switch (entity) {
      case 'note':
        return <FileText size={16} color="#059669" />;
      case 'file':
        return <Files size={16} color="#2563eb" />;
      case 'member':
        return <Users size={16} color="#d97706" />;
      case 'ai':
        return <Sparkles size={16} color="#7c3aed" />;
      default:
        return <FolderGit2 size={16} color="var(--primary)" />;
    }
  };

  const formatActionName = (action) => {
    return action.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Timeline</h1>
          <p className="page-subtitle">
            Comprehensive audit log of every modification, AI query, file upload, and membership change.
          </p>
        </div>

        <div className="page-actions">
          <NavLink to={`/projects/${projectId}/analytics`} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Analytics</span>
          </NavLink>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter by Type:</span>
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.35rem 0.85rem' }}
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Events</option>
          <option value="note">Notes</option>
          <option value="file">Files</option>
          <option value="member">Team Members</option>
          <option value="ai">Gemini AI</option>
          <option value="project">Project Settings</option>
        </select>
      </div>

      {/* Timeline Stream Card */}
      <div className="card" style={{ padding: '2rem' }}>
        {loading ? (
          <TableSkeleton rows={6} />
        ) : activities.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity recorded"
            description="Actions performed by team members will be logged automatically here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            {/* Timeline vertical bar */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                bottom: '12px',
                left: '18px',
                width: '2px',
                backgroundColor: 'var(--border-light)',
                zIndex: 1
              }}
            />

            {activities.map((act) => (
              <div
                key={act._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                {/* Circle icon marker */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '2px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}
                >
                  {getActivityIcon(act.entityType)}
                </div>

                {/* Event Content */}
                <div style={{ flex: 1, backgroundColor: 'var(--bg-app)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong style={{ color: 'var(--text-main)' }}>{act.user?.name || 'User'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}> performed </span>
                      <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {formatActionName(act.action)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      <Clock size={13} />
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Details / Target */}
                  {act.details && Object.keys(act.details).length > 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                      {act.details.title && <div>Title: "{act.details.title}"</div>}
                      {act.details.fileName && <div>File: "{act.details.fileName}"</div>}
                      {act.details.tool && <div>AI Feature: {act.details.tool}</div>}
                      {act.details.newRole && <div>New Role: {act.details.newRole}</div>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
