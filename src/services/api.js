import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Don't auto-redirect, let components handle it
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  getCurrentUser: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout')
}

// User API (Admin)
export const userAPI = {
  getAllUsers: (params) => api.get('/api/auth/users', { params }),
  updateUserRole: (userId, role) => api.patch(`/api/auth/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/api/auth/users/${userId}`)
}

// // User Events API
// export const userEventsAPI = {
//   searchUsers: (query) => api.get('/api/users/search', { params: { q: query } }),
//   getUserEvents: (userId) => api.get(`/api/events/user/${userId}`)
// }

export default api
