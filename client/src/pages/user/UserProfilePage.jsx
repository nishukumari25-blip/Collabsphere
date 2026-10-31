import React, { useState } from 'react';
import {
  User,
  Mail,
  Github,
  Award,
  Edit3,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const UserProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    githubUrl: user?.githubUrl || '',
    skills: user?.skills?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Developer Profile</h1>
          <p className="page-subtitle">
            Your personal information, technical bio, and expertise shown to project collaborators.
          </p>
        </div>

        <div className="page-actions">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.75rem',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {user?.name}
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              @{user?.username} • <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Email Address
              </div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="var(--text-light)" />
                <span>{user?.email}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                About / Bio
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {user?.bio || 'No bio written yet. Click "Edit Profile" to tell your team about yourself.'}
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                GitHub Profile
              </div>
              {user?.githubUrl ? (
                <a
                  href={user.githubUrl.startsWith('http') ? user.githubUrl : `https://${user.githubUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}
                >
                  <Github size={16} />
                  <span>{user.githubUrl}</span>
                </a>
              ) : (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Not configured</span>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Skills & Technologies
              </div>
              {user?.skills?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {user.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.3rem 0.75rem',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No skills listed</span>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
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
              <label className="form-label">Bio (max 250 characters)</label>
              <textarea
                name="bio"
                rows={3}
                maxLength={250}
                className="form-textarea"
                placeholder="Software Engineer passionate about cloud-native systems..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GitHub URL or Profile</label>
              <input
                type="text"
                name="githubUrl"
                className="form-input"
                placeholder="https://github.com/username"
                value={formData.githubUrl}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Skills (comma-separated)</label>
              <input
                type="text"
                name="skills"
                className="form-input"
                placeholder="JavaScript, React, Node.js, Python, MongoDB"
                value={formData.skills}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
