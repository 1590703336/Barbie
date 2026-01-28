import api from './api'

export async function signIn(payload) {
  const response = await api.post('/auth/sign-in', payload)
  return response.data ?? {}
}

export async function signUp(payload) {
  const response = await api.post('/auth/sign-up', payload)
  return response.data ?? {}
}

export function signOut() {
  // Backend logout only requires clearing the token on the client side
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('auth_user')
  }
  return Promise.resolve({ success: true, message: 'Logout successful' })
}

export async function forgotPassword(email) {
  const response = await api.post('/auth/forgot-password', { email })
  return response.data ?? {}
}

export async function resetPassword(token, password, confirmPassword) {
  const response = await api.post('/auth/reset-password', { token, password, confirmPassword })
  return response.data ?? {}
}

export async function verifyResetToken(token) {
  const response = await api.get(`/auth/verify-reset-token/${token}`)
  return response.data ?? {}
}

