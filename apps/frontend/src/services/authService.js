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

