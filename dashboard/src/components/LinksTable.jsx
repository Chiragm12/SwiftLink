import React from 'react';
import { BarChart2, ExternalLink } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function truncate(str, max = 52) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function LinksTable({ links, selectedKey, onSelect }) {
  if (!links || links.length === 0) {
    return (
      <div className="state-box" style={{ margin: '0 auto' }}>
        <div className="state-icon empty">
          <BarChart2 size={24} />
        </div>
        <div className="state-title">No links yet</div>
        <div className="state-message">
          Create your first short link and click data will appear here.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="table-wrap">
        <table className="links-table">
          <thead>
            <tr>
              <th>Short Key</th>
              <th>Destination</th>
              <th>Clicks</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr
                key={link.short_key}
                className={selectedKey === link.short_key ? 'selected' : ''}
                onClick={() => onSelect(link.short_key)}
              >
                <td>
                  <span className="short-key-cell">
                    {link.short_key}
                  </span>
                </td>
                <td>
                  <span className="dest-url" title={link.long_url}>
                    {truncate(link.long_url)}
                  </span>
                </td>
                <td>
                  <span className="click-badge">
                    {link.total_clicks?.toLocaleString() ?? 0}
                  </span>
                </td>
                <td>
                  <span className="date-cell">{formatDate(link.created_at)}</span>
                </td>
                <td>
                  <button
                    className={`view-btn ${selectedKey === link.short_key ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSelect(link.short_key); }}
                  >
                    <BarChart2 size={13} />
                    Analytics
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="link-cards">
        {links.map((link) => (
          <div
            key={link.short_key}
            className={`link-card-item ${selectedKey === link.short_key ? 'selected' : ''}`}
            onClick={() => onSelect(link.short_key)}
          >
            <div className="link-card-row">
              <span className="short-key-cell">{link.short_key}</span>
              <span className="click-badge">
                {link.total_clicks?.toLocaleString() ?? 0}
              </span>
            </div>
            <div className="link-card-url" title={link.long_url}>
              {link.long_url}
            </div>
            <div className="link-card-footer">
              <span className="date-cell">{formatDate(link.created_at)}</span>
              <button
                className={`view-btn ${selectedKey === link.short_key ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelect(link.short_key); }}
              >
                <BarChart2 size={13} />
                View Analytics
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}