import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm'
import { forgotPassword as forgotPasswordService } from '../services/authService'

function ForgotPassword() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleForgotPassword = async (payload) => {
        setLoading(true)
        setError('')
        setSuccess(false)
        try {
            const data = await forgotPasswordService(payload.email)
            if (data?.success) {
                setSuccess(true)
            } else {
                setError('Something went wrong. Please try again.')
            }
        } catch (err) {
            const message =
                err?.response?.data?.message ??
                err?.message ??
                'Failed to send reset email. Please try again later.'
            setError(message)
        } finally {
            setLoading(false)
        }
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
                <h1 className="text-4xl font-bold text-main">Forgot your password?</h1>
                <p className="text-base text-secondary">
                    No problem! Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="rounded-2xl glass-panel p-4 text-sm text-muted shadow-sm">
                    <p className="font-semibold text-indigo-300">Security Note</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-secondary">
                        <li>Reset links expire after 15 minutes</li>
                        <li>You can only use each reset link once</li>
                        <li>If you don't receive an email, check your spam folder</li>
                    </ul>
                </div>
            </Motion.div>

            <Motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md space-y-3"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                        <p className="text-secondary animate-pulse">Sending reset link...</p>
                    </div>
                ) : success ? (
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl glass-card p-6 space-y-4"
                    >
                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-800 dark:text-green-200">
                            <p className="font-semibold">Email sent!</p>
                            <p className="mt-1">If this email is registered, a password reset link will be sent.</p>
                        </div>
                        <Link
                            to="/login"
                            className="block w-full text-center rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
                        >
                            Back to login
                        </Link>
                    </Motion.div>
                ) : (
                    <>
                        <div className="glass-card p-6 rounded-2xl">
                            <ForgotPasswordForm onSubmit={handleForgotPassword} loading={loading} />
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

export default ForgotPassword
