import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import {
  Files,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  FileCode,
  Image,
  FileText,
  File,
  AlertCircle
} from 'lucide-react';
import { fileService } from '../../services/fileService';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CategoryBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';

export const ProjectFilesPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole, currentProject, loadProject } = useProject();
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fileService.getFiles(projectId, {
        search: search.trim() || undefined,
        category: category !== 'all' ? category : undefined
      });
      if (res.success) {
        setFiles(res.files || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load project files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchFiles();
    }, 250);
    return () => clearTimeout(debounce);
  }, [projectId, search, category]);

  useEffect(() => {
    if (!currentProject || currentProject._id !== projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await fileService.uploadFile(projectId, selectedFile, (percent) => {
        setUploadProgress(percent);
      });
      if (res.success) {
        toast.success(`"${res.file.originalName}" uploaded successfully`);
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadProgress(0);
        fetchFiles();
      }
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fileService.deleteFile(projectId, deleteTarget._id);
      if (res.success) {
        toast.success(res.message);
        setDeleteTarget(null);
        fetchFiles();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete file');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getFileIcon = (cat) => {
    switch (cat) {
      case 'code':
        return <FileCode size={18} color="var(--primary)" />;
      case 'image':
        return <Image size={18} color="#059669" />;
      case 'document':
        return <FileText size={18} color="#2563eb" />;
      default:
        return <File size={18} color="#64748b" />;
    }
  };

  const canUpload = ['OWNER', 'ADMIN', 'MEMBER'].includes(userRole);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Files & Artifacts</h1>
          <p className="page-subtitle">
            Securely uploaded code files, architectural diagrams, schemas, and assets.
          </p>
        </div>

        {canUpload && (
          <div className="page-actions">
            <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
              <Upload size={16} />
              <span>Upload File</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search files by filename..."
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
            <option value="code">Code Files</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Files Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : files.length === 0 ? (
          <EmptyState
            icon={Files}
            title={search ? 'No matching files found' : 'No files uploaded yet'}
            description={
              search
                ? 'Check your search spelling or reset your category filter.'
                : 'Upload code snippets, JSON schemas, images, or PDFs to collaborate.'
            }
            actionLabel={canUpload && !search ? 'Upload First File' : undefined}
            onAction={canUpload && !search ? () => setUploadModalOpen(true) : undefined}
          />
        ) : (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Uploader</th>
                  <th>Uploaded Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const isUploader = file.uploader?._id === user?._id || file.uploader === user?._id;
                  const canDelete = isUploader || ['OWNER', 'ADMIN'].includes(userRole);

                  return (
                    <tr key={file._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {getFileIcon(file.category)}
                          <NavLink
                            to={`/projects/${projectId}/files/${file._id}`}
                            style={{ fontWeight: 600, color: 'var(--text-main)' }}
                          >
                            {file.originalName}
                          </NavLink>
                        </div>
                      </td>

                      <td>
                        <CategoryBadge category={file.category} />
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>
                        {file.uploader?.name || 'Anonymous'}
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <NavLink
                            to={`/projects/${projectId}/files/${file._id}`}
                            className="btn-icon"
                            title="Preview file"
                          >
                            <Eye size={16} />
                          </NavLink>
                          <a
                            href={fileService.getDownloadUrl(projectId, file._id)}
                            download={file.originalName}
                            className="btn-icon"
                            title="Download file"
                          >
                            <Download size={16} />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(file)}
                              className="btn-icon"
                              title="Delete file"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Project File">
        <form onSubmit={handleUploadSubmit}>
          <div className="form-group">
            <label className="form-label">Select File to Upload</label>
            <input
              type="file"
              required
              className="form-input"
              onChange={handleFileChange}
            />
            <div className="form-hint" style={{ marginTop: '0.4rem' }}>
              Allowed types: .js, .jsx, .ts, .tsx, .html, .css, .json, .py, .md, .txt, .png, .jpg, .jpeg, .webp, .pdf (Max: 15MB)
            </div>
          </div>

          {selectedFile && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}
            >
              <div><strong>File:</strong> {selectedFile.name}</div>
              <div><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)} KB</div>
            </div>
          )}

          {uploading && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: 'var(--primary)',
                    transition: 'width 200ms ease'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteTarget?.originalName}" from project storage?`}
        confirmText="Delete File"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
};
