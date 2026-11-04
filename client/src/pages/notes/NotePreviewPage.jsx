import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Edit3,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  User,
  Sparkles
} from 'lucide-react';
import { noteService } from '../../services/noteService';
import { geminiService } from '../../services/geminiService';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { CategoryBadge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { DetailsSkeleton } from '../../components/LoadingSkeleton';

export const NotePreviewPage = () => {
  const { id: projectId, noteId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = useProject();
  const toast = useToast();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Gemini AI Explain Note states
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [copiedAi, setCopiedAi] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      try {
        const res = await noteService.getNoteById(projectId, noteId);
        if (res.success && res.note) {
          setNote(res.note);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load note');
        navigate(`/projects/${projectId}/notes`);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [projectId, noteId]);

  const handleCopyMarkdown = () => {
    if (!note?.content) return;
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    toast.success('Raw markdown copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplainNote = async () => {
    if (!note?.content?.trim()) {
      toast.warning('This note has no written body to explain.');
      return;
    }
    setAiExplaining(true);
    setAiModalOpen(true);
    try {
      const res = await geminiService.explainNote({
        title: note.title,
        content: note.content,
        projectId
      });
      if (res.success && res.result) {
        setAiExplanation(res.result);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to explain note with Gemini AI');
    } finally {
      setAiExplaining(false);
    }
  };

  const handleCopyAiExplanation = () => {
    if (!aiExplanation) return;
    navigator.clipboard.writeText(aiExplanation);
    setCopiedAi(true);
    toast.success('AI explanation copied to clipboard');
    setTimeout(() => setCopiedAi(false), 2000);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await noteService.deleteNote(projectId, noteId);
      if (res.success) {
        toast.success('Note deleted');
        navigate(`/projects/${projectId}/notes`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete note');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <DetailsSkeleton />;
  if (!note) return null;

  const isAuthor = note.author?._id === user?._id || note.author === user?._id;
  const canEdit = isAuthor || ['ADMIN', 'OWNER'].includes(userRole);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => navigate(`/projects/${projectId}/notes`)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>All Notes</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExplainNote}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}
            disabled={aiExplaining}
          >
            <Sparkles size={14} />
            <span>{aiExplaining ? 'Analyzing...' : 'Explain Note'}</span>
          </button>

          <button onClick={handleCopyMarkdown} className="btn btn-secondary btn-sm">
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>

          {canEdit && (
            <NavLink to={`/projects/${projectId}/notes/${noteId}/edit`} className="btn btn-secondary btn-sm">
              <Edit3 size={14} />
              <span>Edit Note</span>
            </NavLink>
          )}

          {canEdit && (
            <button onClick={() => setDeleteConfirmOpen(true)} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Note Header Details */}
      <div className="card" style={{ padding: '2rem 2.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {note.title}
          </h1>
          <CategoryBadge category={note.category} />
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} />
            <span>Author: <strong>{note.author?.name || 'Anonymous'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} />
            <span>Last modified: {new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {note.tags.map((t, idx) => (
              <span
                key={idx}
                style={{
                  padding: '0.15rem 0.5rem',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note Content Area */}
      <div className="card" style={{ padding: '2.5rem' }}>
        <div className="markdown-body">
          <ReactMarkdown>{note.content || '*This note has no written body.*'}</ReactMarkdown>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${note.title}"? This cannot be undone.`}
        confirmText="Delete Note"
        isDanger={true}
        loading={deleteLoading}
      />

      {/* Gemini AI Note Explanation Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Gemini AI Note Analysis"
        maxWidth="720px"
      >
        <div>
          {aiExplaining ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '3px solid var(--border-light)',
                  borderTopColor: 'var(--primary)',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1.25rem'
                }}
              />
              <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Analyzing Note with Gemini AI...
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Synthesizing key technical concepts, context, and actionable takeaways.
              </p>
            </div>
          ) : aiExplanation ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCopyAiExplanation}
                  className="btn btn-secondary btn-sm"
                >
                  {copiedAi ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  <span>{copiedAi ? 'Copied' : 'Copy Explanation'}</span>
                </button>
              </div>
              <div
                className="markdown-body"
                style={{
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <ReactMarkdown>{aiExplanation}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No explanation generated yet.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
