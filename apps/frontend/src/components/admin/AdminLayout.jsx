/**
 * AdminLayout Component
 * 
 * Layout wrapper for admin pages with navigation and session management.
 * Uses purple accent color to distinguish from user app.
 */

import { useEffect, useCallback, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion as Motion } from 'framer-motion'
import { adminSignOut, refreshAdminSession } from '../../services/adminService'
import useStore from '../../store/store'

// Navigation items for admin sidebar
const NAV_ITEMS = [
    { path: '/admin/dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { path: '/admin/financials', label: 'Financials', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { path: '/admin/subscriptions', label: 'Subscriptions', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { path: '/admin/currency', label: 'Currency', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

function AdminLayout() {
    const navigate = useNavigate()
    const admin = useStore((state) => state.admin)
    const adminToken = useStore((state) => state.adminToken)
    const adminExpiresAt = useStore((state) => state.adminExpiresAt)
    const adminLogout = useStore((state) => state.adminLogout)
    const updateAdminSession = useStore((state) => state.updateAdminSession)
    const isAdminAuthenticated = useStore((state) => state.isAdminAuthenticated)

    const sessionTimerRef = useRef(null)

    // Calculate remaining session time
    const getTimeRemaining = useCallback(() => {
        if (!adminExpiresAt) return 0
        return Math.max(0, Math.floor((adminExpiresAt - Date.now()) / 1000 / 60))
    }, [adminExpiresAt])

    // Handle logout
    const handleLogout = useCallback(async () => {
        await adminSignOut()
        adminLogout()
        navigate('/admin/login', { replace: true })
    }, [adminLogout, navigate])

    // Auto-logout on session expiry
    useEffect(() => {
        if (!isAdminAuthenticated || !adminExpiresAt) return

        const checkSession = () => {
            if (Date.now() >= adminExpiresAt) {
                handleLogout()
            }
        }

        // Check every minute
        sessionTimerRef.current = setInterval(checkSession, 60000)
        checkSession() // Check immediately

        return () => {
            if (sessionTimerRef.current) {
                clearInterval(sessionTimerRef.current)
            }
        }
    }, [isAdminAuthenticated, adminExpiresAt, handleLogout])

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAdminAuthenticated || !adminToken) {
            navigate('/admin/login', { replace: true })
        }
    }, [isAdminAuthenticated, adminToken, navigate])

    // Refresh session on user activity
    const handleActivityRefresh = useCallback(async () => {
        if (!adminToken) return

        try {
            const response = await refreshAdminSession()
            if (response.success) {
                updateAdminSession({
                    token: response.data.token,
                    expiresAt: response.data.expiresAt,
                })
            }
        } catch (error) {
            console.error('Failed to refresh admin session:', error)
        }
    }, [adminToken, updateAdminSession])

    if (!isAdminAuthenticated) {
        return null // Will redirect
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <Motion.aside
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-64 glass-panel border-r border-purple-500/20 p-4 flex flex-col"
            >
                {/* Logo/Header */}
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="font-bold text-main">Admin</h2>
                        <p className="text-xs text-purple-400">Dashboard</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-purple-500/20 text-purple-300 font-medium'
                                    : 'text-secondary hover:bg-slate-700/50 hover:text-main'
                                }`
                            }
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Session Info & Logout */}
                <div className="mt-auto pt-4 border-t border-slate-700 space-y-3">
                    {/* Session Timer */}
                    <div
                        className="px-3 py-2 rounded-lg bg-slate-800/50 text-xs cursor-pointer hover:bg-slate-700/50"
                        onClick={handleActivityRefresh}
                        title="Click to refresh session"
                    >
                        <div className="flex items-center justify-between text-secondary">
                            <span>Session expires in:</span>
                            <span className={`font-mono ${getTimeRemaining() <= 5 ? 'text-rose-400' : 'text-purple-400'}`}>
                                {getTimeRemaining()} min
                            </span>
                        </div>
                    </div>

                    {/* Admin Info */}
                    <div className="px-3 py-2">
                        <p className="text-sm font-medium text-main truncate">{admin?.name || 'Admin'}</p>
                        <p className="text-xs text-muted truncate">{admin?.email}</p>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </Motion.aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
