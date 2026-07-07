// Thin fetch wrapper. In dev, VITE_API_URL is blank and requests hit the Vite
// proxy (/api -> localhost:5000). In prod it points at the Render API URL.
const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path, body) => request(path, { method: 'DELETE', body }),
};

// ---- Endpoints ----
export const getHealth = () => api.get('/api/health');

export const authApi = {
  me: () => api.get('/api/auth/me'),
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  logout: () => api.post('/api/auth/logout'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
  deleteAccount: () => api.del('/api/auth/account'),
};

export const blizzardApi = {
  status: () => api.get('/api/blizzard/status'),
  authorize: () => api.get('/api/blizzard/authorize'),
  resync: () => api.post('/api/blizzard/resync'),
  unlink: () => api.post('/api/blizzard/unlink'),
};

export const charactersApi = {
  list: () => api.get('/api/characters'),
  get: (id) => api.get(`/api/characters/${id}`),
  achievements: (id) => api.get(`/api/characters/${id}/achievements`),
  quests: (id) => api.get(`/api/characters/${id}/quests`),
  syncOne: (id) => api.post(`/api/characters/${id}/sync`),
  setHidden: (id, hidden) => api.patch(`/api/characters/${id}`, { hidden }),
};

export const syncApi = {
  all: (force = false) => api.post('/api/sync', { force }),
};

export const achievementsApi = {
  list: () => api.get('/api/achievements'),
  characters: (achievementId) => api.get(`/api/achievements/${achievementId}/characters`),
};

export const questsApi = {
  list: () => api.get('/api/quests'),
  characters: (questId) => api.get(`/api/quests/${questId}/characters`),
};

export const collectionsApi = {
  mounts: () => api.get('/api/collections/mounts'),
  pets: () => api.get('/api/collections/pets'),
  toys: () => api.get('/api/collections/toys'),
};

// Direct <img src> URL for a collectible's render (public passthrough endpoint).
export const collectibleImageUrl = (type, refId) =>
  `${API_BASE}/api/collections/media/${type}/${refId}`;
