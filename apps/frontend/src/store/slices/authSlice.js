import { queryClient } from '../../lib/queryClient'

const getStoredAuth = () => {
  if (typeof window === 'undefined') return { user: null, token: null }
  try {
    const storedUser = window.localStorage.getItem('auth_user')
    const storedToken = window.localStorage.getItem('auth_token')
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken ?? null,
    }
  } catch (error) {
    console.warn('Failed to read stored auth info', error)
    return { user: null, token: null }
  }
}

const persistAuth = (user, token) => {
  if (typeof window === 'undefined') return
  try {
    if (token) {
      window.localStorage.setItem('auth_token', token)
      window.localStorage.setItem('auth_user', JSON.stringify(user ?? null))
    }
  } catch (error) {
    console.warn('Failed to write stored auth info', error)
  }
}

const clearPersistedAuth = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('auth_user')
  } catch (error) {
    console.warn('Failed to clear stored auth info', error)
  }
}

const { user: storedUser, token: storedToken } = getStoredAuth()

export const createAuthSlice = (set) => ({
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  login: ({ user, token }) => {
    // Clear any cached data from previous user on new login
    queryClient.clear()
    persistAuth(user, token)
    set({
      user: user ?? null,
      token: token ?? null,
      isAuthenticated: Boolean(token),
    })
  },
  logout: () => {
    // Clear all cached user data to prevent data leakage to next user
    queryClient.clear()
    clearPersistedAuth()
    // Reset UI state to current month/year
    const currentDate = new Date()
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      selectedMonth: currentDate.getMonth() + 1,
      selectedYear: currentDate.getFullYear(),
    })
  },
})
