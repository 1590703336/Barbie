import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RegisterForm from '../components/auth/RegisterForm'
import { signUp as signUpService } from '../services/authService'
import useStore from '../store/store'

function Register() {
  const navigate = useNavigate()
  const login = useStore((state) => state.login)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (payload) => {
    setLoading(true)
    setError('')
    try {
      const data = await signUpService(payload)
      const user = data?.data?.user ?? {
        email: payload.email,
        name: payload.name,
      }
      const token = data?.data?.token ?? null
      login({
        user,
        token,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        'Registration failed, please try again later'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:items-start">
      <div className="flex-1 space-y-4">
        <p className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
          Register account
        </p>
        <h1 className="text-4xl font-bold text-white">Create your account</h1>
        <p className="text-base text-slate-400">
          After registering, you’ll be logged in automatically and redirected to the dashboard, where you can add subscriptions and expenses.
        </p>
        <div className="rounded-2xl glass-panel p-4 text-sm text-slate-300 shadow-sm">
          <p className="font-semibold text-indigo-300">Form notes</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-slate-400">
            <li>Calls services/authService.register on submit</li>
            <li>On success, user info is stored in the Zustand global state</li>
            <li>On failure, an error message is shown</li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        <div className="glass-card p-6 rounded-2xl">
          <RegisterForm onSubmit={handleRegister} loading={loading} />
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

