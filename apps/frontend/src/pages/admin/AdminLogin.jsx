/**
 * AdminLogin Page
 * 
 * Dedicated login page for admin access.
 * Uses separate authentication from regular users.
 */

import { useState, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminSignIn } from '../../services/adminService'
import useStore from '../../store/store'
import PasswordInput from '../../components/common/PasswordInput'

function AdminLogin() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const adminLogin = useStore((state) => state.adminLogin)
    const adminLogout = useStore((state) => state.adminLogout)
    const isAdminAuthenticated = useStore((state) => state.isAdminAuthenticated)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [expiredMessage, setExpiredMessage] = useState('')

    // Redirect if already authenticated
    useEffect(() => {
        if (isAdminAuthenticated) {
            navigate('/admin/dashboard', { replace: true })
        }
    }, [isAdminAuthenticated, navigate])

    // Handle session expiry redirect
    useEffect(() => {
        if (searchParams.get('expired') === 'true') {
            adminLogout()
            setExpiredMessage('Your admin session has expired. Please log in again.')
        }
    }, [searchParams, adminLogout])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await adminSignIn({ email, password })

            if (response.success) {
                adminLogin({
                    user: response.data.user,
                    token: response.data.token,
                    expiresAt: response.data.expiresAt,
                })
                navigate('/admin/dashboard', { replace: true })
            }
        } catch (err) {
            const message =
                err?.response?.data?.message ??
                err?.message ??
                'Login failed. Please check your credentials.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-main">Admin Portal</h1>
                    <p className="text-secondary mt-2">
                        Restricted access. Admin credentials required.
                    </p>
                </div>

                {/* Session Expired Warning */}
                {expiredMessage && (
                    <Motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {expiredMessage}
                        </div>
                    </Motion.div>
                )}

                {/* Login Form */}
                <div className="glass-card p-8 rounded-2xl border border-purple-500/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-secondary mb-2">
                                Admin Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg px-4 py-3 text-main bg-slate-800/50 border border-slate-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="admin@example.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-secondary mb-2">
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="••••••••"
                                inputClassName="px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3"
                            >
                                {error}
                            </Motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                'Sign In to Admin Portal'
                            )}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-xs text-muted text-center">
                            🔒 This portal is for authorized administrators only.
                            <br />
                            Session expires after 30 minutes of inactivity.
                        </p>
                    </div>
                </div>
            </Motion.div>
        </div>
    )
}

export default AdminLogin
