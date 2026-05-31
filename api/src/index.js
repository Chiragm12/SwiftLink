require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, runMigrations } = require('./db');
const { connectRedis } = require('./cache');
const linkRoutes = require('./routes/links');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date() })
);

async function start() {
  await connectDB();
  await runMigrations();
  await connectRedis();
  app.listen(PORT, () => console.log(`SwiftLink running on port ${PORT}`));
}

start();