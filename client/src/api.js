// Thin fetch wrapper. In dev, VITE_API_URL is blank and requests hit the Vite
// proxy (/api -> localhost:5000). In prod it points at the Render API URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export function getHealth() {
  return apiGet('/api/health');
}
