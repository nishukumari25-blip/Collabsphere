import React from 'react';

export const RoleBadge = ({ role }) => {
  const normalized = (role || 'MEMBER').toUpperCase();
  const cls = `badge badge-${normalized.toLowerCase()}`;
  return <span className={cls}>{normalized}</span>;
};

export const StatusBadge = ({ status }) => {
  const normalized = status || 'active';
  const label = normalized.replace('_', ' ');
  return <span className={`badge badge-${normalized}`}>{label}</span>;
};

export const VisibilityBadge = ({ visibility }) => {
  const normalized = visibility || 'private';
  return <span className={`badge badge-${normalized}`}>{normalized}</span>;
};

export const CategoryBadge = ({ category }) => {
  return (
    <span
      className="badge"
      style={{
        backgroundColor: '#f1f5f9',
        color: '#475569',
        border: '1px solid #cbd5e1'
      }}
    >
      {category || 'general'}
    </span>
  );
};
