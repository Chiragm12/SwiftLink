import React from 'react';

export default function StatCard({ icon, label, value, color = 'teal', small = false }) {
  return (
    <div className="stat-card fade-in">
      <div className={`stat-icon-box ${color}`}>
        {icon}
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className={`stat-value ${small ? 'small' : ''}`} title={value}>
          {value ?? '—'}
        </div>
      </div>
    </div>
  );
}