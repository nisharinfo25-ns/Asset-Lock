import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
})

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined' && !['/login', '/register', '/'].includes(window.location.pathname)) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
  updateWallet: (walletAddress) => api.put('/auth/wallet', { walletAddress }),
}

export const assetsAPI = {
  upload: (formData) => api.post('/assets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }),
  getAll: () => api.get('/assets'),
  getById: (id) => api.get(`/assets/${id}`),
  getShared: () => api.get('/assets/shared'),
  grantAccess: (id, userId) => api.post(`/assets/${id}/grant-access`, { userId }),
  revokeAccess: (id, userId) => api.post(`/assets/${id}/revoke-access`, { userId }),
  requestAccess: (id, message) => api.post(`/assets/${id}/request-access`, { message }),
  verifyIntegrity: (id, fileHash) => api.post(`/assets/${id}/verify-integrity`, fileHash ? { fileHash } : {}),
  getAuditLogs: (id) => api.get(`/assets/${id}/audit`),
}

export const requestsAPI = {
  getAll: () => api.get('/access-requests'),
  respond: (id, action) => api.put(`/access-requests/${id}/respond`, { action }),
}

export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
}

export const auditAPI = {
  getAll: (params) => api.get('/audit', { params }),
}

export default api
