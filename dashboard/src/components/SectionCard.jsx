import React from 'react';

export default function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <div className={`section-card ${className}`}>
      <div className="section-card-header">
        <div className="section-card-title">
          {icon}
          {title}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="section-card-body">
        {children}
      </div>
    </div>
  );
}