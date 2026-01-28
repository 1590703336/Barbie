import { useState, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ResetPasswordForm from '../components/auth/ResetPasswordForm'
import { resetPassword as resetPasswordService, verifyResetToken } from '../services/authService'

function ResetPassword() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [tokenValid, setTokenValid] = useState(false)

    // Verify token on mount
    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setError('No reset token provided.')
                setVerifying(false)
                return
            }

            try {
                const data = await verifyResetToken(token)
                if (data?.success) {
                    setTokenValid(true)
                } else {
                    setError('Invalid or expired reset token.')
                }
            } catch (err) {
                setError('Invalid or expired reset token.')
            } finally {
                setVerifying(false)
            }
        }

        checkToken()
    }, [token])

    const handleResetPassword = async (payload) => {
        setLoading(true)
        setError('')
        try {
            const data = await resetPasswordService(token, payload.password, payload.confirmPassword)
            if (data?.success) {
                setSuccess(true)
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login')
                }, 3000)
            } else {
                setError('Failed to reset password. Please try again.')
            }
        } catch (err) {
            const message =
                err?.response?.data?.message ??
                err?.message ??
                'Failed to reset password. Please try again later.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-12">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="text-secondary">Verifying reset token...</p>
                </div>
            </div>
        )
    }

    if (!tokenValid) {
        return (
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-12">
                <Motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md space-y-4"
                >
                    <div className="rounded-2xl glass-card p-6 space-y-4">
                        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-800 dark:text-rose-200">
                            <p className="font-semibold">Invalid Reset Link</p>
                            <p className="mt-1">{error || 'This password reset link is invalid or has expired.'}</p>
                        </div>
                        <Link
                            to="/forgot-password"
                            className="block text-center rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
                        >
                            Request New Reset Link
                        </Link>
                    </div>
                </Motion.div>
            </div>
        )
    }

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-start">
            <Motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 space-y-4"
            >
                <p className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                    Password Reset
                </p>
                <h1 className="text-4xl font-bold text-main">Reset your password</h1>
                <p className="text-base text-secondary">
                    Enter your new password below. Make sure it's at least 6 characters long.
                </p>
                <div className="rounded-2xl glass-panel p-4 text-sm text-muted shadow-sm">
                    <p className="font-semibold text-indigo-300">Password Requirements</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-secondary">
                        <li>Minimum 6 characters</li>
                        <li>Must match confirmation</li>
                        <li>This link will expire after use</li>
                    </ul>
                </div>
            </Motion.div>

            <Motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md space-y-3"
            >
                {success ? (
                    <div className="rounded-2xl glass-card p-6 space-y-4">
                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-800 dark:text-green-200">
                            <p className="font-semibold">Password reset successful!</p>
                            <p className="mt-1">You can now log in with your new password. Redirecting to login...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="glass-card p-6 rounded-2xl">
                            <ResetPasswordForm onSubmit={handleResetPassword} loading={loading} />
                        </div>
                        {error && <p className="text-sm text-rose-400">{error}</p>}
                        <p className="text-sm text-secondary">
                            Remember your password?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 underline">
                                Back to login
                            </Link>
                        </p>
                    </>
                )}
            </Motion.div>
        </div>
    )
}

export default ResetPassword
