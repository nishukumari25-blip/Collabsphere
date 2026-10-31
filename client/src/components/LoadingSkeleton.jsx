import React from 'react';

export const CardSkeleton = () => (
  <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    <div className="skeleton" style={{ height: '24px', width: '60%' }}></div>
    <div className="skeleton" style={{ height: '16px', width: '90%' }}></div>
    <div className="skeleton" style={{ height: '16px', width: '40%' }}></div>
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
      <div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '12px' }}></div>
      <div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '12px' }}></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="table-responsive" style={{ padding: '1rem' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="skeleton" style={{ height: '20px', width: '30%' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '25%' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '20%' }}></div>
        <div className="skeleton" style={{ height: '20px', width: '15%' }}></div>
      </div>
    ))}
  </div>
);

export const DetailsSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <div className="skeleton" style={{ height: '36px', width: '45%' }}></div>
    <div className="skeleton" style={{ height: '20px', width: '75%' }}></div>
    <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: 'var(--radius-md)' }}></div>
  </div>
);
