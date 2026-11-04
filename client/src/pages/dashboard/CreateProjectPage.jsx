import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useToast } from '../../context/ToastContext';

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    status: 'active',
    goals: '',
    technologies: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await projectService.createProject(formData);
      if (res.success && res.project) {
        toast.success(`Project "${res.project.name}" created successfully!`);
        navigate(`/projects/${res.project._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <h1 className="page-title">Create New Project</h1>
        <p className="page-subtitle">
          Initialize a collaborative workspace for your engineering team with notes, files, and AI tooling.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              required
              className="form-input"
              placeholder="e.g. Distributed Consensus Engine"
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
              placeholder="Brief explanation of the project's purpose and scope..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select
                name="visibility"
                className="form-select"
                value={formData.visibility}
                onChange={handleChange}
              >
                <option value="private">Private (Only invited members)</option>
                <option value="public">Public (Visible to community)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
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
          </div>

          <div className="form-group">
            <label className="form-label">Technologies (comma-separated)</label>
            <input
              type="text"
              name="technologies"
              className="form-input"
              placeholder="React, Node.js, MongoDB, Docker, Python"
              value={formData.technologies}
              onChange={handleChange}
            />
            <div className="form-hint">Enter the programming languages, frameworks, or databases used</div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Goals & Milestones</label>
            <textarea
              name="goals"
              rows={3}
              className="form-textarea"
              placeholder="What are the key deliverables, milestones, and architectural targets?"
              value={formData.goals}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Deadline (Optional)</label>
            <input
              type="date"
              name="deadline"
              className="form-input"
              value={formData.deadline}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Initializing Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
