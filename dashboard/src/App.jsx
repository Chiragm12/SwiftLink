import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Link2, RefreshCw, BarChart2, MousePointerClick,
  Layers, Globe, Loader2,
} from 'lucide-react';
import { api } from './lib/api.js';
import StatCard from './components/StatCard.jsx';
import SectionCard from './components/SectionCard.jsx';
import LinksTable from './components/LinksTable.jsx';
import { HourlyChart, ReferrersChart, DeviceChart } from './components/Charts.jsx';

/* ── helpers ─────────────────────────────────────────── */
function fmtNum(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

/* ── App ─────────────────────────────────────────────── */
export default function App() {
  const [days, setDays] = useState(7);
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState(null);

  const [selectedKey, setSelectedKey] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  /* fetch links list */
  const fetchLinks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLinksLoading(true);
    setLinksError(null);
    try {
      const data = await api.getTopLinks();
      setLinks(data);
      return data;
    } catch (err) {
      setLinksError(err.message);
      return null;
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLinksLoading(false);
    }
  }, []);

  /* fetch analytics for a specific link */
  const fetchAnalytics = useCallback(async (shortKey, d) => {
    if (!shortKey) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await api.getLinkAnalytics(shortKey, d);
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(err.message);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  /* initial load */
  useEffect(() => {
    fetchLinks().then((data) => {
      if (data && data.length > 0) {
        const first = data[0].short_key;
        setSelectedKey(first);
        fetchAnalytics(first, days);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* when days changes, reload analytics */
  useEffect(() => {
    if (selectedKey) {
      fetchAnalytics(selectedKey, days);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  /* when selected link changes */
  const handleSelectLink = useCallback((key) => {
    if (key === selectedKey) return;
    setSelectedKey(key);
    fetchAnalytics(key, days);
  }, [selectedKey, days, fetchAnalytics]);

  /* refresh everything */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const [data] = await Promise.all([
      fetchLinks(false),
    ]);
    if (selectedKey) {
      await fetchAnalytics(selectedKey, days);
    } else if (data && data.length > 0) {
      const first = data[0].short_key;
      setSelectedKey(first);
      await fetchAnalytics(first, days);
    }
    setRefreshing(false);
  }, [selectedKey, days, fetchLinks, fetchAnalytics]);

  /* derived stats */
  const totalClicks = useMemo(
    () => links.reduce((s, l) => s + (l.total_clicks || 0), 0),
    [links]
  );

  const rangeClicks = analytics?.totalClicks ?? null;

  const topReferrer = useMemo(() => {
    if (!analytics?.topReferrers?.length) return '—';
    const top = analytics.topReferrers[0];
    return top.referrer || 'Direct';
  }, [analytics]);

  const selectedLink = useMemo(
    () => links.find(l => l.short_key === selectedKey),
    [links, selectedKey]
  );

  /* ── render ── */

  if (linksLoading) {
    return (
      <>
        <Header days={days} setDays={setDays} onRefresh={handleRefresh} refreshing={refreshing} />
        <div className="state-container">
          <div className="state-box">
            <div className="state-icon loading">
              <Loader2 size={24} />
            </div>
            <div className="state-title">Loading dashboard…</div>
            <div className="state-message">Fetching your link analytics.</div>
          </div>
        </div>
      </>
    );
  }

  if (linksError) {
    return (
      <>
        <Header days={days} setDays={setDays} onRefresh={handleRefresh} refreshing={refreshing} />
        <div className="state-container">
          <div className="state-box">
            <div className="state-icon error">
              <BarChart2 size={24} />
            </div>
            <div className="state-title">Failed to load</div>
            <div className="state-message">{linksError}</div>
            <button className="refresh-btn" style={{ marginTop: 20 }} onClick={handleRefresh}>
              <RefreshCw size={14} />
              <span>Try again</span>
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header days={days} setDays={setDays} onRefresh={handleRefresh} refreshing={refreshing} />

      <main className="dashboard">
        {/* Stat Cards */}
        <div className="stat-cards">
          <StatCard
            icon={<Layers size={20} />}
            label="Tracked Links"
            value={fmtNum(links.length)}
            color="teal"
          />
          <StatCard
            icon={<MousePointerClick size={20} />}
            label="Total Clicks"
            value={fmtNum(totalClicks)}
            color="blue"
          />
          <StatCard
            icon={<BarChart2 size={20} />}
            label={`Clicks (${days}d)`}
            value={analyticsLoading ? '…' : fmtNum(rangeClicks)}
            color="gold"
          />
          <StatCard
            icon={<Globe size={20} />}
            label="Top Referrer"
            value={analyticsLoading ? '…' : topReferrer}
            color="teal"
            small
          />
        </div>

        {/* Links Table */}
        <div className="links-section">
          <div className="section-label">All links</div>
          <div className="section-card">
            <div className="section-card-body" style={{ padding: 0 }}>
              <LinksTable
                links={links}
                selectedKey={selectedKey}
                onSelect={handleSelectLink}
              />
            </div>
          </div>
        </div>

        {/* Detail Section */}
        {selectedKey && (
          <div className="detail-section fade-in">
            <div className="section-label">
              Link analytics
            </div>

            {analyticsError ? (
              <div className="section-card">
                <div className="section-card-body">
                  <div className="state-box" style={{ margin: '0 auto' }}>
                    <div className="state-icon error">
                      <BarChart2 size={22} />
                    </div>
                    <div className="state-title">Analytics unavailable</div>
                    <div className="state-message">{analyticsError}</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Detail header + mini stats */}
                <div className="section-card" style={{ marginBottom: 20 }}>
                  <div className="detail-header-bar">
                    <span className="short-key-cell" style={{ fontSize: 16 }}>
                      <Link2 size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--teal)' }} />
                      {selectedKey}
                    </span>
                    {selectedLink?.long_url && (
                      <span className="detail-url" title={selectedLink.long_url}>
                        {selectedLink.long_url}
                      </span>
                    )}
                  </div>
                  <div className="detail-mini-stats">
                    <div className="mini-stat">
                      <div className="mini-stat-label">Total Clicks</div>
                      <div className="mini-stat-value">
                        {analyticsLoading ? '…' : fmtNum(analytics?.totalClicks)}
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="mini-stat-label">Top Referrer</div>
                      <div className={`mini-stat-value ${topReferrer.length > 20 ? 'small' : ''}`}>
                        {analyticsLoading ? '…' : topReferrer}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="charts-grid">
                  <HourlyChart
                    data={analytics?.hourlyClicks}
                    loading={analyticsLoading}
                  />
                  <ReferrersChart
                    data={analytics?.topReferrers}
                    loading={analyticsLoading}
                  />
                  <DeviceChart
                    data={analytics?.deviceBreakdown}
                    loading={analyticsLoading}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {links.length === 0 && (
          <div className="state-container">
            <div className="state-box">
              <div className="state-icon empty">
                <Link2 size={24} />
              </div>
              <div className="state-title">No links tracked yet</div>
              <div className="state-message">
                Start creating short links and your analytics will appear here automatically.
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/* ── Header component ─────────────────────────────────── */
function Header({ days, setDays, onRefresh, refreshing }) {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo-mark">
          <Link2 size={16} />
        </div>
        <span className="header-title">
          Swift<span>Link</span>
        </span>
      </div>

      <div className="header-controls">
        <select
          className="range-select"
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          aria-label="Select date range"
        >
          <option value={1}>Last 1 day</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>

        <button
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh data"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}