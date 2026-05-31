const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function connectDB() {
  const client = await pool.connect();
  console.log('✅ PostgreSQL connected');
  client.release();
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Main links table
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id          BIGSERIAL PRIMARY KEY,
        short_key   VARCHAR(10) UNIQUE NOT NULL,
        long_url    TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        expires_at  TIMESTAMPTZ,
        is_active   BOOLEAN DEFAULT TRUE
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_links_short_key ON links(short_key);
    `);

    // Analytics clicks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id          BIGSERIAL PRIMARY KEY,
        short_key   VARCHAR(10) NOT NULL,
        clicked_at  TIMESTAMPTZ DEFAULT NOW(),
        referrer    TEXT,
        device_type VARCHAR(20),
        ip_hash     VARCHAR(64)
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clicks_short_key ON clicks(short_key);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
    `);

    console.log('✅ Migrations complete');
  } finally {
    client.release();
  }
}

module.exports = { pool, connectDB, runMigrations };