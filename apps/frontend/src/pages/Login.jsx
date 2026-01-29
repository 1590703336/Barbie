import { useState, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import { signIn as signInService } from '../services/authService'
import useStore from '../store/store'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const login = useStore((state) => state.login)
  const logout = useStore((state) => state.logout)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expiredMessage, setExpiredMessage] = useState('')

  // Handle token expiration redirect
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      logout() // Ensure store is cleared
      setExpiredMessage('Your session has expired. Please log in again.')
    }
  }, [searchParams, logout])

  const handleLogin = async (payload) => {
    setLoading(true)
    setError('')
    try {
      const data = await signInService(payload)
      const user = data?.data?.user ?? { email: payload.email }
      const token = data?.data?.token ?? null
      login({
        user,
        token,
      })
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Login failed, please try again later'
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
          Authentication
        </p>
        <h1 className="text-4xl font-bold text-main">Welcome back</h1>
        <p className="text-base text-secondary">
          Use your account to sign in and manage your expenses and subscriptions. If you don’t have an account yet, please register first.
        </p>
        <div className="rounded-2xl glass-panel p-4 text-sm text-muted shadow-sm">
          <p className="font-semibold text-indigo-300">Frontend notes</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-secondary">
            <li>Authentication state is stored in Zustand</li>
            <li>On success, users are redirected to the dashboard</li>
            <li>API calls are wrapped in services/authService</li>
          </ul>
        </div>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md space-y-3"
      >
        {expiredMessage && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-800 dark:text-amber-200">
            {expiredMessage}
          </div>
        )}
        <div className="glass-card p-6 rounded-2xl">
          <LoginForm onSubmit={handleLogin} loading={loading} />
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}

        <p className="text-sm text-secondary">
          Don’t have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 underline">
            Go to register
          </Link>
        </p>
      </Motion.div>
    </div>
  )
}

export default Login

