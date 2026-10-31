import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Save,
  Sparkles,
  ArrowLeft,
  Eye,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { noteService } from '../../services/noteService';
import { geminiService } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';

export const CreateNotePage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    tags: '',
    content: ''
  });
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview' | 'split'
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleImproveWithAI = async () => {
    if (!formData.content.trim()) {
      toast.warning('Please enter some note content first before asking Gemini to improve it.');
      return;
    }

    setImproving(true);
    try {
      const res = await geminiService.improveNote({
        title: formData.title || 'Untitled',
        content: formData.content,
        projectId
      });
      if (res.success && res.result) {
        setFormData((prev) => ({ ...prev, content: res.result }));
        toast.success('Gemini AI improved your note structure and readability!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to improve note with Gemini');
    } finally {
      setImproving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Note title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await noteService.createNote(projectId, formData);
      if (res.success && res.note) {
        toast.success('Note published successfully');
        navigate(`/projects/${projectId}/notes/${res.note._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(`/projects/${projectId}/notes`)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Notes</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleImproveWithAI}
            className="btn btn-secondary"
            disabled={improving}
            title="Use Gemini AI to enhance grammar, clarity and structure"
            style={{ borderColor: 'var(--primary-border)' }}
          >
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {improving ? 'Gemini Improving...' : 'Improve with Gemini'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} />
            <span>{loading ? 'Publishing...' : 'Publish Note'}</span>
          </button>
        </div>
      </div>

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

      {/* Note Meta inputs */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Note Title *</label>
            <input
              type="text"
              name="title"
              required
              className="form-input"
              placeholder="e.g. Distributed Consensus Architecture Spec"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Category</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="general">General</option>
              <option value="architecture">Architecture</option>
              <option value="api">API Spec</option>
              <option value="meeting">Meeting Notes</option>
              <option value="bug">Bug Triage</option>
              <option value="guide">Guide</option>
              <option value="research">Research</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              className="form-input"
              placeholder="raft, consensus, spec"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Editor & Preview Workspace */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '0.75rem',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('write')}
              className={`btn btn-sm ${activeTab === 'write' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Edit3 size={14} />
              <span>Write</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Eye size={14} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`btn btn-sm ${activeTab === 'split' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span>Split View</span>
            </button>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Markdown supported: # H1, ## H2, **bold**, `code`, ```blocks```, tables
          </span>
        </div>

        {activeTab === 'write' && (
          <textarea
            name="content"
            rows={22}
            className="form-textarea"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.6 }}
            placeholder="# Write your technical documentation in Markdown here..."
            value={formData.content}
            onChange={handleChange}
          />
        )}

        {activeTab === 'preview' && (
          <div
            className="markdown-body"
            style={{ minHeight: '450px', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}
          >
            {formData.content ? (
              <ReactMarkdown>{formData.content}</ReactMarkdown>
            ) : (
              <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Nothing to preview yet.</p>
            )}
          </div>
        )}

        {activeTab === 'split' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minHeight: '500px' }}>
            <textarea
              name="content"
              rows={22}
              className="form-textarea"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.6 }}
              placeholder="# Write Markdown..."
              value={formData.content}
              onChange={handleChange}
            />
            <div
              className="markdown-body"
              style={{ padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', overflowY: 'auto', maxHeight: '500px' }}
            >
              {formData.content ? (
                <ReactMarkdown>{formData.content}</ReactMarkdown>
              ) : (
                <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Live preview appears here.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
