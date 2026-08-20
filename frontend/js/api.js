const API_BASE = '/api';

async function apiGet(path, params = {}) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${API_BASE}${path}${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
  return res.json();
}

const Api = {
  classes: () => apiGet('/students/classes'),
  crossModule: (params) => apiGet('/reports/cross-module', params),
  crossModuleDetail: (id, params) => apiGet(`/reports/cross-module/${id}`, params),
  correlation: (params) => apiGet('/reports/correlation', params),
};
