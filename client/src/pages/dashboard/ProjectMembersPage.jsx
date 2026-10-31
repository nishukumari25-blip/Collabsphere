import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/notificationService';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export const ProjectMembersPage = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { currentProject, userRole, loadProject } = useProject();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await projectService.getMembers(projectId);
      if (res.success) {
        setMembers(res.members || []);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    if (!currentProject || currentProject._id !== projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  // Search users autocomplete for invitation
  const handleSearchUsers = async (q) => {
    setInviteIdentifier(q);
    if (q.trim().length >= 2) {
      try {
        const res = await userService.searchUsers(q.trim());
        if (res.success) setSearchResults(res.users || []);
      } catch (err) {
        // silent fail
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) {
      toast.error('Please enter an email or username');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await projectService.addMember(projectId, {
        identifier: inviteIdentifier.trim(),
        role: inviteRole
      });
      if (res.success) {
        toast.success(res.message);
        setIsInviteOpen(false);
        setInviteIdentifier('');
        setSearchResults([]);
        fetchMembers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    try {
      const res = await projectService.updateMemberRole(projectId, targetUserId, newRole);
      if (res.success) {
        toast.success('Member role updated successfully');
        fetchMembers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update member role');
    }
  };

  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await projectService.removeMember(projectId, deleteTarget.user?._id || deleteTarget.user);
      if (res.success) {
        toast.success(res.message);
        setDeleteTarget(null);
        fetchMembers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canManageMembers = ['OWNER', 'ADMIN'].includes(userRole);
  const isOwner = userRole === 'OWNER';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Collaboration</h1>
          <p className="page-subtitle">
            Manage member permissions, access tiers, and collaborative privileges for this project.
          </p>
        </div>

        {canManageMembers && (
          <div className="page-actions">
            <button onClick={() => setIsInviteOpen(true)} className="btn btn-primary">
              <UserPlus size={16} />
              <span>Add Team Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Members Table Card */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Current Role</th>
                  <th>Joined Date</th>
                  {canManageMembers && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const mUser = m.user || {};
                  const isCurrentMemberOwner = m.role === 'OWNER';
                  const isSelf = mUser._id === user?._id;

                  return (
                    <tr key={mUser._id || Math.random()}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}
                          >
                            {mUser.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {mUser.name} {isSelf && <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>(You)</span>}
                            </div>
                            {mUser.bio && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {mUser.bio.substring(0, 45)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>@{mUser.username}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{mUser.email}</td>

                      <td>
                        {canManageMembers && !isCurrentMemberOwner && (!m.role === 'ADMIN' || isOwner) ? (
                          <select
                            className="form-select"
                            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            value={m.role}
                            onChange={(e) => handleUpdateRole(mUser._id, e.target.value)}
                          >
                            {isOwner && <option value="ADMIN">ADMIN</option>}
                            <option value="MEMBER">MEMBER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <RoleBadge role={m.role} />
                        )}
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(m.joinedAt || Date.now()).toLocaleDateString()}
                      </td>

                      {canManageMembers && (
                        <td style={{ textAlign: 'right' }}>
                          {!isCurrentMemberOwner && (
                            <button
                              onClick={() => setDeleteTarget(m)}
                              className="btn-icon"
                              title="Remove member"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Add Team Member">
        <form onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">Email Address or Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Search registered user or enter email..."
                value={inviteIdentifier}
                onChange={(e) => handleSearchUsers(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 50,
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >
                  {searchResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => {
                        setInviteIdentifier(u.username);
                        setSearchResults([]);
                      }}
                      style={{
                        padding: '0.6rem 0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-light)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username} • {u.email}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Select</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-hint">Type at least 2 characters to search registered developers</div>
          </div>

          <div className="form-group">
            <label className="form-label">Project Role</label>
            <select
              className="form-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              {isOwner && <option value="ADMIN">ADMIN — Full management of notes, files & activities</option>}
              <option value="MEMBER">MEMBER — Can create/edit notes, upload files, run AI tools</option>
              <option value="VIEWER">VIEWER — Read-only viewing rights</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={inviteLoading}
            >
              {inviteLoading ? 'Adding Member...' : 'Add Member to Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${deleteTarget?.user?.name || 'this member'} from the project? They will lose access to all notes and files.`}
        confirmText="Remove Member"
        loading={deleteLoading}
      />
    </div>
  );
};
