import axios from 'axios'

// Dynamically construct API base URL based on Vite's base path
// Production (/): /api/v1
// Preview (/preview/): /preview/api/v1
const basePath = import.meta.env.BASE_URL.replace(/\/$/, ''); // remove trailing slash
const apiBaseURL = import.meta.env.VITE_API_BASE_URL ?? `${basePath}/api/v1`;

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
})

// You can add request/response interceptors here, e.g., inject token or unify error handling
api.interceptors.request.use(
  (config) => {
    try {
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('auth_token')
          : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.warn('Failed to read local token', error)
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout on 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Clear stored auth
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token')
        window.localStorage.removeItem('auth_user')

        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = `${basePath}/login?expired=true`
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
