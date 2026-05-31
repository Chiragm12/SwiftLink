const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/:shortKey', async (req, res) => {
  const { shortKey } = req.params;
  const { days = 7 } = req.query;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const link = await pool.query(
    'SELECT * FROM links WHERE short_key = $1', [shortKey]
  );
  if (!link.rows.length) return res.status(404).json({ error: 'Not found' });

  const [total, hourly, referrers, devices] = await Promise.all([
    pool.query(`SELECT COUNT(*) as total FROM clicks WHERE short_key=$1 AND clicked_at>=$2`, [shortKey, since]),
    pool.query(`SELECT date_trunc('hour', clicked_at) AS hour, COUNT(*) AS clicks FROM clicks WHERE short_key=$1 AND clicked_at>=$2 GROUP BY hour ORDER BY hour`, [shortKey, since]),
    pool.query(`SELECT COALESCE(referrer,'Direct') AS referrer, COUNT(*) AS clicks FROM clicks WHERE short_key=$1 AND clicked_at>=$2 GROUP BY referrer ORDER BY clicks DESC LIMIT 5`, [shortKey, since]),
    pool.query(`SELECT COALESCE(device_type,'Unknown') AS device, COUNT(*) AS clicks FROM clicks WHERE short_key=$1 AND clicked_at>=$2 GROUP BY device_type ORDER BY clicks DESC`, [shortKey, since]),
  ]);

  return res.json({
    link: link.rows[0],
    totalClicks: parseInt(total.rows[0].total),
    hourlyClicks: hourly.rows,
    topReferrers: referrers.rows,
    deviceBreakdown: devices.rows,
  });
});

router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT l.short_key, l.long_url, l.created_at, COUNT(c.id) AS total_clicks
     FROM links l LEFT JOIN clicks c ON l.short_key = c.short_key
     GROUP BY l.short_key, l.long_url, l.created_at
     ORDER BY total_clicks DESC LIMIT 20`
  );
  return res.json(result.rows);
});

module.exports = router;