const API_BASE = 'http://localhost:3000';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const api = {
  getTopLinks: () => request('/api/analytics'),
  getLinkAnalytics: (shortKey, days = 7) =>
    request(`/api/analytics/${shortKey}?days=${days}`),
};