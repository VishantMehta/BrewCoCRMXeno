const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(endpoint, data) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  chat: (message) => apiClient.post('/ai/chat', { message }),
  
  getCustomers: (page = 1) => apiClient.get(`/customers?page=${page}`),
  
  getSegments: () => apiClient.get('/segments'),
  createSegment: (data) => apiClient.post('/segments', data),
  previewSegment: (rules) => apiClient.post('/segments/preview', { rules_json: rules }),
  
  getCampaigns: () => apiClient.get('/campaigns'),
  createCampaign: (data) => apiClient.post('/campaigns', data),
  launchCampaign: (id) => apiClient.post(`/campaigns/${id}/launch`, {}),
  getCampaignStats: (id) => apiClient.get(`/campaigns/${id}/stats`),
};
