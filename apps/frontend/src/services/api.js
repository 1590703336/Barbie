import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
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
  (error) => Promise.reject(error),
)

export default api

