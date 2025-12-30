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
        <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Register account
        </p>
        <h1 className="text-4xl font-bold text-slate-900">Create your account</h1>
        <p className="text-base text-slate-600">
          After registering, you’ll be logged in automatically and redirected to the dashboard, where you can add subscriptions and expenses.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold">Form notes</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
            <li>Calls services/authService.register on submit</li>
            <li>On success, user info is stored in the Zustand global state</li>
            <li>On failure, an error message is shown</li>
          </ul>
        </div>
      </div>

      <div className="w-full max-w-md space-y-3">
        <RegisterForm onSubmit={handleRegister} loading={loading} />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-slate-900 underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register

