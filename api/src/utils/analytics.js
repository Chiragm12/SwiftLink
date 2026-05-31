const { pool } = require('../db');

function detectDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) return 'mobile';
  if (/tablet/.test(ua)) return 'tablet';
  return 'desktop';
}

function hashIP(ip) {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// This is called AFTER the redirect is already sent.
// It runs in background — user never waits for this.
function logClickAsync(shortKey, req) {
  const referrer = req.headers['referer'] || null;
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  pool
    .query(
      `INSERT INTO clicks (short_key, referrer, device_type, ip_hash)
       VALUES ($1, $2, $3, $4)`,
      [shortKey, referrer, detectDevice(userAgent), hashIP(ip)]
    )
    .catch((err) => console.error('Click log error:', err.message));
}

module.exports = { logClickAsync };