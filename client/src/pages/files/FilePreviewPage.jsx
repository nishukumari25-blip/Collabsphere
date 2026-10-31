import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCode,
  Download,
  Trash2,
  ArrowLeft,
  Sparkles,
  Calendar,
  User,
  HardDrive
} from 'lucide-react';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { CategoryBadge } from '../../components/Badge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailsSkeleton } from '../../components/LoadingSkeleton';

export const FilePreviewPage = () => {
  const { id: projectId, fileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = useProject();
  const toast = useToast();

  const [file, setFile] = useState(null);
  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchFileData = async () => {
      setLoading(true);
      try {
        const metaRes = await fileService.getFileMetadata(projectId, fileId);
        if (metaRes.success && metaRes.file) {
          setFile(metaRes.file);

          // If code, markdown, or text file, fetch raw content
          if (
            metaRes.file.category === 'code' ||
            ['.md', '.txt', '.json', '.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.py'].includes(metaRes.file.extension)
          ) {
            try {
              const previewRes = await fileService.previewRaw(projectId, fileId);
              if (previewRes.success && previewRes.content !== undefined) {
                setRawContent(previewRes.content);
              }
            } catch (prevErr) {
              console.error('Could not load text preview:', prevErr);
            }
          }
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load file details');
        navigate(`/projects/${projectId}/files`);
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [projectId, fileId]);

  const handleExplainWithAI = () => {
    if (!rawContent) return;
    // Navigate to AI Code Explainer with prefilled code and language
    navigate('/ai/explain', {
      state: {
        code: rawContent,
        fileName: file?.originalName,
        projectId
      }
    });
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fileService.deleteFile(projectId, fileId);
      if (res.success) {
        toast.success(res.message);
        navigate(`/projects/${projectId}/files`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete file');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <DetailsSkeleton />;
  if (!file) return null;

  const isUploader = file.uploader?._id === user?._id || file.uploader === user?._id;
  const canDelete = isUploader || ['OWNER', 'ADMIN'].includes(userRole);
  const isImage = file.category === 'image';
  const isCode = file.category === 'code' || ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.md'].includes(file.extension);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => navigate(`/projects/${projectId}/files`)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>All Project Files</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isCode && rawContent && (
            <button onClick={handleExplainWithAI} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--primary-border)' }}>
              <Sparkles size={14} color="var(--primary)" />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Explain with Gemini</span>
            </button>
          )}

          <a
            href={fileService.getDownloadUrl(projectId, file._id)}
            download={file.originalName}
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} />
            <span>Download</span>
          </a>

          {canDelete && (
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* File Info Header */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', wordBreak: 'break-all' }}>
            {file.originalName}
          </h1>
          <CategoryBadge category={file.category} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HardDrive size={15} />
            <span>Size: {(file.size / 1024).toFixed(1)} KB</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} />
            <span>Uploader: {file.uploader?.name || 'Anonymous'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} />
            <span>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* File Body Preview */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {isImage ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <img
              src={fileService.getPreviewUrl(projectId, file._id)}
              alt={file.originalName}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                objectFit: 'contain'
              }}
            />
          </div>
        ) : isCode && rawContent ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-light)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>Text / Code Preview ({rawContent.split('\n').length} lines)</span>
              <span>Encoding: UTF-8</span>
            </div>
            <pre
              style={{
                backgroundColor: 'var(--bg-code)',
                color: '#e6edf3',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                maxHeight: '650px'
              }}
            >
              <code>{rawContent}</code>
            </pre>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={48} color="var(--text-light)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Preview Not Supported in Browser
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              This file type ({file.extension}) cannot be rendered directly in the web previewer.
            </p>
            <a
              href={fileService.getDownloadUrl(projectId, file._id)}
              download={file.originalName}
              className="btn btn-primary"
            >
              <Download size={16} />
              <span>Download File to View</span>
            </a>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${file.originalName}" permanently?`}
        confirmText="Delete File"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
};
