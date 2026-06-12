import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      }
      try {
        const { data } = await axios.post('/api/users/login/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  sendEmailCode: (email) => api.post('/users/get-email-code/', { email }),
  register: (data) => api.post('/users/register/', data),
  login: (email, password) => api.post('/users/login/', { email, password }),
  logout: (refresh_token) => api.post('/users/logout/', { refresh: refresh_token }),
  getGoogleUrl: () => api.get('/users/google/auth/google/url/'),
  googleCallback: (code) => api.post('/users/google/google/callback/', { code }),
}

// Tasks
export const tasksApi = {
  list: () => api.get('/tasks/'),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
}

// Projects
export const projectsApi = {
  list: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
}

// Comments
export const commentsApi = {
  list: () => api.get('/comments/'),
  create: (data) => api.post('/comments/', data),
  update: (id, data) => api.patch(`/comments/${id}/`, data),
  delete: (id) => api.delete(`/comments/${id}/`),
}

export default api
