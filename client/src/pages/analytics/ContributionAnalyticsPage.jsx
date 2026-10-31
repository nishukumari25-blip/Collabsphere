import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  BarChart3,
  Users,
  FileText,
  Files,
  Cpu,
  TrendingUp,
  HardDrive,
  Calendar,
  Activity,
  History
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { DetailsSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';

export const ContributionAnalyticsPage = () => {
  const { id: projectId } = useParams();
  const { currentProject, loadProject } = useProject();
  const toast = useToast();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await analyticsService.getProjectAnalytics(projectId);
        if (res.success && res.analytics) {
          setAnalytics(res.analytics);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load project analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    if (!currentProject || currentProject._id !== projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  if (loading) return <DetailsSkeleton />;
  if (!analytics) return null;

  const {
    totalActivities,
    totalNotes,
    totalFiles,
    totalStorageBytes,
    memberContributions,
    notesByCategory,
    filesStats,
    dailyActivity
  } = analytics;

  // Compute maximum daily activity for scaling chart
  const maxDailyCount = Math.max(...(dailyActivity?.map((d) => d.count) || [1]), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contribution Analytics</h1>
          <p className="page-subtitle">
            Database-backed statistics for project velocity, member workload distribution, and storage utilization.
          </p>
        </div>

        <div className="page-actions">
          <NavLink to={`/projects/${projectId}/timeline`} className="btn btn-secondary">
            <History size={16} />
            <span>View Full Timeline</span>
          </NavLink>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Activities
            </span>
            <Activity size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalActivities}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            Real MongoDB events tracked
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Documentation Notes
            </span>
            <FileText size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalNotes}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            Across {notesByCategory?.length || 0} categories
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Uploaded Artifacts
            </span>
            <Files size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalFiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            {(totalStorageBytes / (1024 * 1024)).toFixed(2)} MB total disk space
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Contributors
            </span>
            <Users size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {memberContributions?.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
            Collaborating in this repository
          </div>
        </div>
      </div>

      {/* 14-Day Activity Cadence Chart */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>
          Activity Velocity (Past 14 Days)
        </h3>
        <p className="card-subtitle" style={{ marginBottom: '1.75rem' }}>
          Actual event frequencies aggregated daily from the Activity collection.
        </p>

        {dailyActivity?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
            No activity registered in the past 14 days.
          </p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '180px', paddingTop: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            {dailyActivity.map((d) => {
              const heightPct = Math.max((d.count / maxDailyCount) * 100, 10);
              return (
                <div key={d._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                    {d.count}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 300ms ease'
                    }}
                    title={`${d._id}: ${d.count} actions`}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
                    {d._id.substring(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Contributions Table */}
      <div className="card" style={{ padding: 0, marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Individual Contributor Metrics</h3>
          <p className="card-subtitle" style={{ marginTop: '0.2rem' }}>
            Verified actions performed per developer: notes created/edited, files uploaded, and AI queries.
          </p>
        </div>

        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Total Actions</th>
                <th>Note Updates</th>
                <th>File Uploads</th>
                <th>AI Queries</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {memberContributions?.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                        {m.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{m.username}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {m.totalActions}
                  </td>
                  <td>{m.noteActions}</td>
                  <td>{m.fileActions}</td>
                  <td>{m.aiActions}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {m.lastActive ? new Date(m.lastActive).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdowns: Notes & Files */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Notes by Category */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Notes Distribution by Category</h3>
          {notesByCategory?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notes categorized yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {notesByCategory.map((c) => {
                const pct = totalNotes > 0 ? Math.round((c.count / totalNotes) * 100) : 0;
                return (
                  <div key={c._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{c._id || 'general'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.count} notes ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#059669' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Files Storage by Category */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Storage Footprint by Category</h3>
          {filesStats?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No files recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filesStats.map((f) => {
                const pct = totalStorageBytes > 0 ? Math.round((f.totalBytes / totalStorageBytes) * 100) : 0;
                return (
                  <div key={f._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{f._id || 'other'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {f.count} files ({(f.totalBytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#2563eb' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
