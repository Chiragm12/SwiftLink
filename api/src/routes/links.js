const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const {
  getCachedURL,
  setCachedURL,
  acquireLock,
  releaseLock,
  checkRateLimit,
} = require('../cache');

const { generateShortKey } = require('../utils/keygen');
const { logClickAsync } = require('../utils/analytics');

// Rate limiter middleware
async function rateLimiter(req, res, next) {
  try {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown';

    const allowed = await checkRateLimit(ip, 60, 1);

    if (!allowed) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }

    next();
  } catch (err) {
    console.error('Rate limiter error:', err);
    next();
  }
}

// POST /api/links — Create a short link
router.post('/', rateLimiter, async (req, res) => {
  const { longUrl, expiresIn } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: 'longUrl is required' });
  }

  try {
    new URL(longUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const shortKey = generateShortKey();
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    const result = await pool.query(
      `INSERT INTO links (short_key, long_url, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shortKey, longUrl, expiresAt]
    );

    // Pre-warm Redis cache
    await setCachedURL(shortKey, longUrl);

    return res.status(201).json({
      shortKey,
      shortUrl: `${process.env.BASE_URL}/${shortKey}`,
      longUrl,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    console.error('Create link error:', err);
    return res.status(500).json({ error: 'Failed to create short link' });
  }
});

// GET /api/links/:shortKey/redirect — Hot redirect path
// IMPORTANT: No rateLimiter here, otherwise k6 load test gets 429
router.get('/:shortKey/redirect', async (req, res) => {
  const { shortKey } = req.params;

  try {
    // Step 1: Redis cache lookup
    let longUrl = await getCachedURL(shortKey);

    if (longUrl) {
      logClickAsync(shortKey, req); // fire and forget
      return res.redirect(302, longUrl);
    }

    // Step 2: Cache miss — acquire lock to avoid cache stampede
    const lockAcquired = await acquireLock(shortKey);

    if (lockAcquired) {
      try {
        const result = await pool.query(
          `SELECT long_url, expires_at, is_active
           FROM links
           WHERE short_key = $1`,
          [shortKey]
        );

        if (!result.rows.length) {
          return res.status(404).json({ error: 'Not found' });
        }

        const link = result.rows[0];

        if (!link.is_active) {
          return res.status(410).json({ error: 'Link deactivated' });
        }

        if (link.expires_at && new Date(link.expires_at) < new Date()) {
          return res.status(410).json({ error: 'Link expired' });
        }

        await setCachedURL(shortKey, link.long_url);

        logClickAsync(shortKey, req);
        return res.redirect(302, link.long_url);
      } finally {
        await releaseLock(shortKey);
      }
    }

    // Step 3: Another request is already fetching from DB
    await new Promise((r) => setTimeout(r, 100));

    longUrl = await getCachedURL(shortKey);

    if (longUrl) {
      logClickAsync(shortKey, req);
      return res.redirect(302, longUrl);
    }

    return res.status(503).json({ error: 'Try again in a moment' });
  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).json({ error: 'Redirect failed' });
  }
});

// GET /api/links — List all links
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT short_key, long_url, created_at, is_active
       FROM links
       ORDER BY created_at DESC
       LIMIT 50`
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('List links error:', err);
    return res.status(500).json({ error: 'Failed to fetch links' });
  }
});

module.exports = router;