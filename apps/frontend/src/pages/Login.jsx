import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import { signIn as signInService } from '../services/authService'
import useStore from '../store/store'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useStore((state) => state.login)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      <div className="flex-1 space-y-4">
        <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Authentication
        </p>
        <h1 className="text-4xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-base text-slate-600">
          Use your account to sign in and manage your expenses and subscriptions. If you don’t have an account yet, please register first.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold">Frontend notes</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
            <li>Authentication state is stored in Zustand</li>
            <li>On success, users are redirected to the dashboard</li>
            <li>API calls are wrapped in services/authService</li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        <LoginForm onSubmit={handleLogin} loading={loading} />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <p className="text-sm text-slate-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-slate-900 underline">
            Go to register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login

