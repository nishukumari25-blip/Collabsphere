import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Tag,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import { noteService } from '../../services/noteService';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { CategoryBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { CardSkeleton } from '../../components/LoadingSkeleton';

export const MarkdownNotesPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { userRole, currentProject, loadProject } = useProject();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await noteService.getNotes(projectId, {
        search: search.trim() || undefined,
        category: category !== 'all' ? category : undefined
      });
      if (res.success) {
        setNotes(res.notes || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load project notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchNotes();
    }, 250);
    return () => clearTimeout(debounce);
  }, [projectId, search, category]);

  useEffect(() => {
    if (!currentProject || currentProject._id !== projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const canCreate = ['OWNER', 'ADMIN', 'MEMBER'].includes(userRole);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Markdown Documentation</h1>
          <p className="page-subtitle">
            Technical specs, architecture documentation, API schemas, and meeting notes.
          </p>
        </div>

        {canCreate && (
          <div className="page-actions">
            <NavLink to={`/projects/${projectId}/notes/new`} className="btn btn-primary">
              <Plus size={16} />
              <span>Create Note</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Search and Category Filters */}
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
            placeholder="Search notes by title, tags, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem' }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="architecture">Architecture</option>
            <option value="api">API Spec</option>
            <option value="meeting">Meeting Notes</option>
            <option value="bug">Bug Triage</option>
            <option value="guide">Guide / Tutorial</option>
            <option value="research">Research</option>
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search ? 'No matching notes found' : 'No notes written yet'}
          description={
            search
              ? 'Try searching with different keywords or reset your category filter.'
              : 'Start documenting your project architecture and APIs with live Markdown and Gemini AI.'
          }
          actionLabel={canCreate && !search ? 'Write First Note' : undefined}
          onAction={canCreate && !search ? () => navigate(`/projects/${projectId}/notes/new`) : undefined}
        />
      ) : (
        <div className="grid-3">
          {notes.map((note) => (
            <div
              key={note._id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/projects/${projectId}/notes/${note._id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.5rem' }}>
                <h3
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    lineHeight: 1.3
                  }}
                >
                  {note.title}
                </h3>
                <CategoryBadge category={note.category} />
              </div>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  marginBottom: '1rem',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {note.content.replace(/#+\s/g, '').replace(/```[\s\S]*?```/g, '[Code Block]') || 'Empty note.'}
              </p>

              {/* Tags */}
              {note.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {note.tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  color: 'var(--text-light)'
                }}
              >
                <span>By {note.author?.name}</span>
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
