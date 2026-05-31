const Redis = require('ioredis');

let redisClient;

async function connectRedis() {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));
}

// ── Basic cache get/set ───────────────────────
async function getCachedURL(shortKey) {
  return await redisClient.get(`url:${shortKey}`);
}

async function setCachedURL(shortKey, longURL, ttl = 86400) {
  await redisClient.setex(`url:${shortKey}`, ttl, longURL);
}

// ── Cache stampede prevention (mutex lock) ────
// When cache expires, thousands of requests all miss at once.
// This lock ensures only ONE request hits Postgres.
// Everyone else waits 200ms, then reads the fresh cache.
async function acquireLock(shortKey, ttl = 5) {
  const result = await redisClient.set(`lock:${shortKey}`, '1', 'NX', 'EX', ttl);
  return result === 'OK'; // true = you got the lock
}

async function releaseLock(shortKey) {
  await redisClient.del(`lock:${shortKey}`);
}

// ── Token Bucket Rate Limiter (Lua script) ────
// Lua runs atomically in Redis — no race conditions possible.
// Each IP has a bucket of tokens. Requests consume tokens.
// Tokens refill at a fixed rate (e.g., 1 per second).
const rateLimitLua = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1]) or capacity
local last_refill = tonumber(data[2]) or now

local elapsed = now - last_refill
local new_tokens = math.min(capacity, tokens + (elapsed * refill_rate))

if new_tokens >= 1 then
  redis.call('HMSET', key, 'tokens', new_tokens - 1, 'last_refill', now)
  redis.call('EXPIRE', key, 3600)
  return 1
else
  redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
  redis.call('EXPIRE', key, 3600)
  return 0
end
`;

async function checkRateLimit(ip, capacity = 60, refillRate = 1) {
  const key = `ratelimit:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const result = await redisClient.eval(rateLimitLua, 1, key, capacity, refillRate, now);
  return result === 1; // true = allowed, false = blocked
}

module.exports = {
  connectRedis,
  getCachedURL,
  setCachedURL,
  acquireLock,
  releaseLock,
  checkRateLimit,
};