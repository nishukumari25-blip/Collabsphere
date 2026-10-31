import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';

export const AccountSettingsPage = () => {
  const toast = useToast();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.changePassword(passwordData);
      if (res.success) {
        toast.success(res.message);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Security & Settings</h1>
          <p className="page-subtitle">
            Update credentials, password protection, and account preferences.
          </p>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <KeyRound size={20} color="var(--primary)" />
          <h3 className="card-title" style={{ margin: 0 }}>Change Account Password</h3>
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
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              required
              className="form-input"
              value={passwordData.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="newPassword"
              required
              className="form-input"
              placeholder="Minimum 6 characters"
              value={passwordData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              required
              className="form-input"
              placeholder="Repeat new password"
              value={passwordData.confirmNewPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '0.5rem' }}
          >
            <Lock size={16} />
            <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
          </button>
        </form>
      </div>

      {/* Security Policies Card */}
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <ShieldCheck size={20} color="var(--success)" />
          <h3 className="card-title" style={{ margin: 0 }}>Authentication Security</h3>
        </div>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <li>Passwords hashed on the backend with 10 salt rounds via <code>bcryptjs</code>.</li>
          <li>Protected routes enforce cryptographic JWT signature validation.</li>
          <li>HttpOnly cookie transmission prevents script-based token interception.</li>
          <li>Rate limiting is active across all endpoints to prevent brute-force attacks.</li>
        </ul>
      </div>
    </div>
  );
};
