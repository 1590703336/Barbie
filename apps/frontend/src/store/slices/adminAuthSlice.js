/**
 * Admin Auth Slice
 * 
 * Zustand slice for admin authentication state.
 * Completely separate from user auth.
 */

const getStoredAdminAuth = () => {
    if (typeof window === 'undefined') return { admin: null, adminToken: null, adminExpiresAt: null }
    try {
        const storedAdmin = window.localStorage.getItem('admin_user')
        const storedToken = window.localStorage.getItem('admin_token')
        const storedExpiry = window.localStorage.getItem('admin_expires_at')
        return {
            admin: storedAdmin ? JSON.parse(storedAdmin) : null,
            adminToken: storedToken ?? null,
            adminExpiresAt: storedExpiry ? parseInt(storedExpiry, 10) : null,
        }
    } catch (error) {
        console.warn('Failed to read stored admin auth info', error)
        return { admin: null, adminToken: null, adminExpiresAt: null }
    }
}

const persistAdminAuth = (admin, token, expiresAt) => {
    if (typeof window === 'undefined') return
    try {
        if (token) {
            window.localStorage.setItem('admin_token', token)
            window.localStorage.setItem('admin_user', JSON.stringify(admin ?? null))
            if (expiresAt) {
                window.localStorage.setItem('admin_expires_at', expiresAt.toString())
            }
        }
    } catch (error) {
        console.warn('Failed to write stored admin auth info', error)
    }
}

const clearPersistedAdminAuth = () => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.removeItem('admin_token')
        window.localStorage.removeItem('admin_user')
        window.localStorage.removeItem('admin_expires_at')
    } catch (error) {
        console.warn('Failed to clear stored admin auth info', error)
    }
}

const { admin: storedAdmin, adminToken: storedAdminToken, adminExpiresAt: storedExpiresAt } = getStoredAdminAuth()

export const createAdminAuthSlice = (set, get) => ({
    // Admin auth state (separate from user auth)
    admin: storedAdmin,
    adminToken: storedAdminToken,
    adminExpiresAt: storedExpiresAt,
    isAdminAuthenticated: Boolean(storedAdminToken),

    // Admin login
    adminLogin: ({ user, token, expiresAt }) => {
        persistAdminAuth(user, token, expiresAt)
        set({
            admin: user ?? null,
            adminToken: token ?? null,
            adminExpiresAt: expiresAt ?? null,
            isAdminAuthenticated: Boolean(token),
        })
    },

    // Admin logout
    adminLogout: () => {
        clearPersistedAdminAuth()
        set({
            admin: null,
            adminToken: null,
            adminExpiresAt: null,
            isAdminAuthenticated: false,
        })
    },

    // Update admin session (for token refresh)
    updateAdminSession: ({ token, expiresAt }) => {
        const currentAdmin = get().admin
        persistAdminAuth(currentAdmin, token, expiresAt)
        set({
            adminToken: token,
            adminExpiresAt: expiresAt,
        })
    },

    // Check if admin session is expired
    isAdminSessionExpired: () => {
        const expiresAt = get().adminExpiresAt
        if (!expiresAt) return true
        return Date.now() >= expiresAt
    },
})
