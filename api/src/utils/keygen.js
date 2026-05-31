// Converts a number to Base62 (A-Z, a-z, 0-9)
// 6 chars = 62^6 = ~56 billion unique keys
const BASE62_CHARS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function toBase62(num) {
  let result = '';
  while (num > 0) {
    result = BASE62_CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result || '0';
}

function generateShortKey(length = 6) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const combined = timestamp * 10000 + random;
  return toBase62(combined).slice(-length);
}

module.exports = { generateShortKey };