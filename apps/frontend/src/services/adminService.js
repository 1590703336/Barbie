/**
 * Admin API Service
 * 
 * API calls for admin authentication and dashboard endpoints.
 * Uses a separate base URL for admin routes: /api/admin
 */

import axios from 'axios'

// Admin API base URL (separate from user API)
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
const adminBaseURL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '/api/admin')
    : `${basePath}/api/admin`

// Create dedicated axios instance for admin API
const adminApi = axios.create({
    baseURL: adminBaseURL,
    withCredentials: true,
})

// Request interceptor - inject admin token
adminApi.interceptors.request.use(
    (config) => {
        try {
            const token = typeof window !== 'undefined'
                ? window.localStorage.getItem('admin_token')
                : null
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        } catch (error) {
            console.warn('Failed to read admin token', error)
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle session expiry
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear admin auth on unauthorized
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem('admin_token')
                window.localStorage.removeItem('admin_user')
                window.localStorage.removeItem('admin_expires_at')

                // Redirect to admin login if not already there
                if (window.location.pathname.startsWith('/admin') &&
                    !window.location.pathname.includes('/admin/login')) {
                    const sessionExpired = error.response?.data?.code === 'SESSION_EXPIRED'
                    window.location.href = `${basePath}/admin/login${sessionExpired ? '?expired=true' : ''}`
                }
            }
        }
        return Promise.reject(error)
    }
)

// ===== Authentication =====

export async function adminSignIn(payload) {
    const response = await adminApi.post('/auth/sign-in', payload)
    return response.data ?? {}
}

export async function adminSignOut() {
    try {
        await adminApi.post('/auth/sign-out')
    } catch (error) {
        // Ignore errors on sign out
    }
    // Always clear local storage
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('admin_token')
        window.localStorage.removeItem('admin_user')
        window.localStorage.removeItem('admin_expires_at')
    }
    return { success: true }
}

export async function refreshAdminSession() {
    const response = await adminApi.post('/auth/refresh')
    return response.data ?? {}
}

export async function getCurrentAdmin() {
    const response = await adminApi.get('/auth/me')
    return response.data ?? {}
}

// ===== Dashboard Overview =====

export async function getPlatformOverview() {
    const response = await adminApi.get('/overview')
    return response.data?.data ?? {}
}

export async function getUserGrowthTrend(params = {}) {
    const response = await adminApi.get('/users/growth', { params })
    return response.data?.data ?? {}
}

// ===== Financial Analytics =====

export async function getPlatformFinancials(params = {}) {
    const response = await adminApi.get('/analytics/financials', { params })
    return response.data?.data ?? {}
}

export async function getCategoryDistribution(params = {}) {
    const response = await adminApi.get('/analytics/categories', { params })
    return response.data?.data ?? {}
}

export async function getBudgetCompliance(params = {}) {
    const response = await adminApi.get('/analytics/budget-compliance', { params })
    return response.data?.data ?? {}
}

// ===== Subscription Analytics =====

export async function getSubscriptionHealth() {
    const response = await adminApi.get('/subscriptions/health')
    return response.data?.data ?? {}
}

// ===== Currency Analytics =====

export async function getCurrencyStats() {
    const response = await adminApi.get('/currency/stats')
    return response.data?.data ?? {}
}

// ===== User Management =====

export async function getAllUsers(params = {}) {
    const response = await adminApi.get('/users', { params })
    // Return both data and pagination
    return {
        data: response.data?.data ?? [],
        pagination: response.data?.pagination ?? {}
    }
}

export async function getUserDetails(userId) {
    const response = await adminApi.get(`/users/${userId}`)
    return response.data?.data ?? {}
}

export async function updateUserRole(userId, role) {
    const response = await adminApi.patch(`/users/${userId}/role`, { role })
    return response.data?.data ?? {}
}

export async function deleteUser(userId) {
    const response = await adminApi.delete(`/users/${userId}`)
    return response.data?.data ?? {}
}

export default adminApi

