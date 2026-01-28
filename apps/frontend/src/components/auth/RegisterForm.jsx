import { useState, useEffect, useRef } from 'react'
import { getAvailableCurrencies } from '../../services/currencyService'
import CurrencySelect from '../common/CurrencySelect'
import PasswordInput from '../common/PasswordInput'

function RegisterForm({ onSubmit, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [currencies, setCurrencies] = useState(['USD'])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const fetchCurrencies = async () => {
      try {
        const availableCurrencies = await getAvailableCurrencies()
        setCurrencies(availableCurrencies.length > 0 ? availableCurrencies : ['USD'])
      } catch (err) {
        console.error('Failed to fetch currencies:', err)
        setCurrencies(['USD'])
      } finally {
        setLoadingCurrencies(false)
      }
    }
    fetchCurrencies()
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.({ email, password, name, defaultCurrency })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-muted">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted">Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="At least 8 characters"
        />
      </div>
      <div>
        <CurrencySelect
          label="Default Currency"
          value={defaultCurrency}
          onChange={setDefaultCurrency}
          currencies={currencies}
          disabled={loadingCurrencies}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400 shadow-lg shadow-indigo-500/30"
      >
        {loading ? 'Signing up...' : 'Sign up'}
      </button>
    </form>
  )
}

export default RegisterForm
