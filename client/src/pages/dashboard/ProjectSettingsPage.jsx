import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  ShieldAlert,
  Share2,
  Trash2,
  Copy,
  Check,
  Save,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailsSkeleton } from '../../components/LoadingSkeleton';

export const ProjectSettingsPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentProject, userRole, loadProject } = useProject();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    status: 'active',
    goals: '',
    technologies: '',
    deadline: ''
  });
  const [publicShareEnabled, setPublicShareEnabled] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        const res = await projectService.getProjectById(projectId);
        if (res.success && res.project) {
          const p = res.project;
          setFormData({
            name: p.name || '',
            description: p.description || '',
            visibility: p.visibility || 'private',
            status: p.status || 'active',
            goals: p.goals || '',
            technologies: Array.isArray(p.technologies) ? p.technologies.join(', ') : '',
            deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : ''
          });
          setPublicShareEnabled(!!p.publicShare?.enabled);
          setShareToken(p.publicShare?.shareToken || '');
        }
      } catch (err) {
        toast.error('Failed to load project settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await projectService.updateProject(projectId, formData);
      if (res.success) {
        toast.success('Project settings saved successfully');
        loadProject(projectId);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update project settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShare = async () => {
    const nextState = !publicShareEnabled;
    try {
      const res = await projectService.togglePublicShare(projectId, nextState);
      if (res.success) {
        setPublicShareEnabled(nextState);
        setShareToken(res.publicShare.shareToken);
        toast.success(res.message);
        loadProject(projectId);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle public share');
    }
  };

  const handleCopyShareUrl = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Public URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateShareUrl = async () => {
    try {
      const res = await projectService.togglePublicShare(projectId, { enabled: true, regenerate: true });
      if (res.success) {
        setPublicShareEnabled(true);
        setShareToken(res.publicShare.shareToken);
        toast.success('Share link regenerated; previous link has been revoked');
        loadProject(projectId);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate public link');
    }
  };

  const handleDeleteProject = async () => {
    setDeleteLoading(true);
    try {
      const res = await projectService.deleteProject(projectId);
      if (res.success) {
        toast.success('Project and associated data deleted permanently');
        navigate('/projects');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <DetailsSkeleton />;

  const isOwner = userRole === 'OWNER';

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Settings</h1>
          <p className="page-subtitle">
            Configure metadata, public sharing links, and administrative controls.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>General Settings</h3>
        <form onSubmit={handleSaveSettings}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              type="text"
              name="name"
              required
              className="form-input"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              rows={3}
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Project Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select
                name="visibility"
                className="form-select"
                value={formData.visibility}
                onChange={handleChange}
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technologies (comma-separated)</label>
            <input
              type="text"
              name="technologies"
              className="form-input"
              value={formData.technologies}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Goals / Mission</label>
            <textarea
              name="goals"
              rows={3}
              className="form-textarea"
              value={formData.goals}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Deadline</label>
            <input
              type="date"
              name="deadline"
              className="form-input"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ marginTop: '0.5rem' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>

      {/* Public Sharing Control Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Public Read-Only Sharing</h3>
            <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
              Allow non-members and external stakeholders to preview project documentation safely.
            </p>
          </div>
          <button
            onClick={handleToggleShare}
            className={`btn ${publicShareEnabled ? 'btn-danger' : 'btn-primary'} btn-sm`}
          >
            {publicShareEnabled ? 'Disable Public Sharing' : 'Enable Public Sharing'}
          </button>
        </div>

        {publicShareEnabled && shareToken && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '1rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              PUBLIC PREVIEW URL:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                style={{ backgroundColor: 'white', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                value={`${window.location.origin}/share/${shareToken}`}
              />
              <button onClick={handleCopyShareUrl} className="btn btn-secondary">
                {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button onClick={handleRegenerateShareUrl} className="btn btn-secondary" title="Revoke current link and generate new token">
                <RefreshCw size={16} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone (OWNER only) */}
      {isOwner && (
        <div className="card" style={{ padding: '2rem', borderColor: 'var(--danger-border)', backgroundColor: '#fffbfb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ShieldAlert size={20} color="var(--danger)" />
            <h3 className="card-title" style={{ color: 'var(--danger)', margin: 0 }}>
              Danger Zone
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Permanently delete this project along with all associated notes, files, and activity history.
            This action cannot be undone.
          </p>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Delete Project Permanently</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Entire Project"
        message="Are you completely sure? This will permanently erase the project repository, all markdown notes, and all uploaded files from storage."
        confirmText="Confirm Permanent Delete"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
};
