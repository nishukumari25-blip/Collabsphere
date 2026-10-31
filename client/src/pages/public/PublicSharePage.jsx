import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  BookOpen,
  FileText,
  Files,
  Users,
  Calendar,
  Layers,
  Target,
  AlertCircle,
  ExternalLink,
  Shield
} from 'lucide-react';
import { publicService } from '../../services/notificationService'; // exported from publicService
import { StatusBadge, CategoryBadge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { DetailsSkeleton } from '../../components/LoadingSkeleton';

export const PublicSharePage = () => {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'files'
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const fetchPublicProject = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicService.getPublicProject(shareToken);
        if (res.success) {
          setData(res);
          if (res.notes?.length > 0) {
            setSelectedNote(res.notes[0]);
          }
        }
      } catch (err) {
        setError(err.message || 'Public project link is invalid or sharing has been disabled');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProject();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '3rem 2rem' }}>
        <DetailsSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container" style={{ padding: '4rem 2rem' }}>
        <EmptyState
          icon={AlertCircle}
          title="Project Not Accessible"
          description={error || 'This project is either private or the public link has expired.'}
          actionLabel="Go to Home"
          onAction={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  const { project, notes, files, stats } = data;

  return (
    <div className="page-container" style={{ padding: '2.5rem 2rem', maxWidth: '1200px' }}>
      {/* Read-Only Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          color: '#1e40af'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={18} color="#2563eb" />
          <span>
            You are viewing a <strong>public read-only preview</strong> of <strong>{project.name}</strong>.
          </span>
        </div>
        <NavLink to="/register" className="btn btn-primary btn-sm">
          Join CollabSphere
        </NavLink>
      </div>

      {/* Project Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 className="page-title">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="page-subtitle" style={{ maxWidth: '800px', fontSize: '1.05rem', lineHeight: 1.6 }}>
            {project.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Technologies and Metadata Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {project.technologies?.map((tech, idx) => (
          <span
            key={idx}
            style={{
              padding: '0.3rem 0.75rem',
              backgroundColor: 'white',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-main)'
            }}
          >
            {tech}
          </span>
        ))}
        {project.deadline && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Calendar size={14} />
            <span>Target: {new Date(project.deadline).toLocaleDateString()}</span>
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: '2rem'
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
        >
          <BookOpen size={16} />
          <span>Overview & Goals</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`btn ${activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
        >
          <FileText size={16} />
          <span>Documentation Notes ({notes?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`btn ${activeTab === 'files' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
        >
          <Files size={16} />
          <span>Shared Files ({files?.length || 0})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Target size={20} color="var(--primary)" />
                <h3 className="card-title" style={{ margin: 0 }}>Project Goals & Architecture</h3>
              </div>
              <p style={{ color: 'var(--text-main)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                {project.goals || 'No specific goals documented yet.'}
              </p>
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Project Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{stats?.membersCount || 1}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TEAM MEMBERS</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{stats?.notesCount || 0}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>NOTES / SPECS</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{stats?.filesCount || 0}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>FILES REPOSITORY</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Project Lead</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {project.owner?.name?.[0]?.toUpperCase() || 'O'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{project.owner?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{project.owner?.username}</div>
                </div>
              </div>
              {project.owner?.bio && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                  {project.owner.bio}
                </p>
              )}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Team Collaborators</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.members?.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-muted)',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {m.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.user?.name}</span>
                    </div>
                    <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.7rem' }}>
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          {notes?.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Public Notes Shared"
              description="The project team has not published any notes for this project yet."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', minHeight: '500px' }}>
              <div className="card" style={{ padding: '1rem', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Project Notes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {notes.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => setSelectedNote(n)}
                      style={{
                        textAlign: 'left',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: selectedNote?._id === n._id ? 'var(--primary-light)' : 'transparent',
                        color: selectedNote?._id === n._id ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: selectedNote?._id === n._id ? 700 : 500,
                        fontSize: '0.875rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {n.category} • {new Date(n.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '2rem' }}>
                {selectedNote ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedNote.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                          <CategoryBadge category={selectedNote.category} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Authored by {selectedNote.author?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="markdown-body">
                      <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Select a note from the left to view documentation.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div className="card" style={{ padding: 0 }}>
          {files?.length === 0 ? (
            <EmptyState
              icon={Files}
              title="No Files Listed"
              description="No public files have been uploaded for this project."
            />
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Category</th>
                    <th>Extension</th>
                    <th>Size</th>
                    <th>Shared Date</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{f.originalName}</td>
                      <td>
                        <CategoryBadge category={f.category} />
                      </td>
                      <td><code>{f.extension}</code></td>
                      <td>{(f.size / 1024).toFixed(1)} KB</td>
                      <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
