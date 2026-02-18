import axios from 'axios'
import { API_CONFIG } from '../config/constants'

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
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
  getCurrentUser: () => api.get(API_CONFIG.ENDPOINTS.AUTH_ME),
  logout: () => api.post(API_CONFIG.ENDPOINTS.AUTH_LOGOUT)
}

// User API (Admin)
export const userAPI = {
  getAllUsers: (params) => api.get(API_CONFIG.ENDPOINTS.AUTH_USERS, { params }),
  updateUserRole: (userId, role) => api.patch(API_CONFIG.ENDPOINTS.AUTH_UPDATE_ROLE(userId), { role }),
  deleteUser: (userId) => api.delete(API_CONFIG.ENDPOINTS.AUTH_DELETE_USER(userId))
}

// // User Events API
// export const userEventsAPI = {
//   searchUsers: (query) => api.get('/api/users/search', { params: { q: query } }),
//   getUserEvents: (userId) => api.get(`/api/events/user/${userId}`)
// }

export default api
