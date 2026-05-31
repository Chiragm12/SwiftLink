import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { TrendingUp, Globe, Smartphone } from 'lucide-react';

/* ── colour palette ─────────────────────────────────────── */
const TEAL  = '#01696f';
const BLUE  = '#006494';
const GOLD  = '#d19900';
const PIE_COLORS = [TEAL, BLUE, GOLD, '#8a7560', '#5a8a7b', '#a05050'];

/* ── helpers ────────────────────────────────────────────── */
function fmtHour(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', hour12: true,
    }).format(d);
  } catch {
    return iso;
  }
}

function fmtHourShort(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

/* ── custom tooltips ────────────────────────────────────── */
function ClickTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{fmtHour(label)}</div>
      <div className="value">{payload[0].value} click{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      <div className="value">{payload[0].value} click{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{payload[0].name}</div>
      <div className="value">{payload[0].value} click{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
}

/* Custom legend for Pie */
function PieLegend({ payload }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: 3, background: entry.color, flexShrink: 0
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Line Chart ─────────────────────────────────────────── */
function HourlyChart({ data, loading }) {
  const prepared = (data || []).map(d => ({ ...d, hourLabel: d.hour }));

  // thin out x-axis ticks if many data points
  const tickCount = prepared.length;
  const tickInterval = tickCount > 48 ? Math.floor(tickCount / 12)
                     : tickCount > 24 ? Math.floor(tickCount / 8)
                     : tickCount > 12 ? 2 : 0;

  return (
    <div className="chart-card wide fade-in">
      <div className="chart-title">
        <TrendingUp size={14} />
        Hourly Click Volume
      </div>
      {loading ? (
        <div className="chart-loading">Loading chart…</div>
      ) : !prepared.length ? (
        <div className="chart-loading">No click data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={prepared} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tickFormatter={fmtHourShort}
              interval={tickInterval}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip content={<ClickTooltip />} />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke={TEAL}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: TEAL }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Horizontal Bar Chart (referrers) ───────────────────── */
function ReferrersChart({ data, loading }) {
  const prepared = (data || [])
    .slice(0, 8)
    .map(d => ({
      referrer: d.referrer || 'Direct',
      clicks: d.clicks,
    }));

  return (
    <div className="chart-card fade-in">
      <div className="chart-title">
        <Globe size={14} />
        Top Referrers
      </div>
      {loading ? (
        <div className="chart-loading">Loading…</div>
      ) : !prepared.length ? (
        <div className="chart-loading">No referrer data</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={prepared}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="referrer"
              width={90}
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v.length > 14 ? v.slice(0, 13) + '…' : v}
            />
            <Tooltip content={<BarTooltip />} />
            <Bar dataKey="clicks" radius={[0, 5, 5, 0]} maxBarSize={22}>
              {prepared.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? TEAL : BLUE} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Pie Chart (device breakdown) ──────────────────────── */
function DeviceChart({ data, loading }) {
  const prepared = (data || []).map(d => ({
    name: d.device || 'Unknown',
    value: d.clicks,
  }));

  return (
    <div className="chart-card fade-in">
      <div className="chart-title">
        <Smartphone size={14} />
        Device Breakdown
      </div>
      {loading ? (
        <div className="chart-loading">Loading…</div>
      ) : !prepared.length ? (
        <div className="chart-loading">No device data</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={prepared}
              cx="50%"
              cy="45%"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={3}
              dataKey="value"
            >
              {prepared.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend content={<PieLegend />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── Exports ────────────────────────────────────────────── */
export { HourlyChart, ReferrersChart, DeviceChart };