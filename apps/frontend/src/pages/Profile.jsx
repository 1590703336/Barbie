import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/store'
import { getUser, updateUser } from '../services/userService'
import { getAvailableCurrencies } from '../services/currencyService'

function Profile() {
    const navigate = useNavigate()
    const { user: storedUser, logout, login } = useStore((state) => state)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [defaultCurrency, setDefaultCurrency] = useState('USD')
    const [password, setPassword] = useState('')
    const [currencies, setCurrencies] = useState(['USD'])

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch currencies
                const availableCurrencies = await getAvailableCurrencies()
                setCurrencies(availableCurrencies.length > 0 ? availableCurrencies : ['USD'])
            } catch (err) {
                console.error('Failed to fetch currencies:', err)
                setCurrencies(['USD'])
            }

            // Fetch user data
            if (!storedUser?._id && !storedUser?.id) {
                setFetching(false)
                return
            }
            try {
                const userId = storedUser._id || storedUser.id
                const data = await getUser(userId)
                // Adjust based on API structure: data.data.user or data.user
                const userData = data?.data?.user || data?.user || data

                setName(userData.name || '')
                setEmail(userData.email || '')
                setDefaultCurrency(userData.defaultCurrency || 'USD')
            } catch (err) {
                console.error('Failed to fetch user data', err)
                setMessage({ type: 'error', text: 'Failed to load user data' })
            } finally {
                setFetching(false)
            }
        }

        fetchData()
    }, [storedUser])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const userId = storedUser?._id || storedUser?.id
            const payload = {
                name,
                email,
                defaultCurrency
            }

            // Only include password if user typed something
            if (password) {
                payload.password = password
            }

            const response = await updateUser(userId, payload)
            const updatedUser = response?.data?.user || response?.user

            if (password) {
                // If password was changed, logout and redirect
                logout()
                navigate('/login', { state: { message: 'Password updated. Please log in again.' } })
            } else {
                // otherwise update local store
                login({ user: updatedUser, token: useStore.getState().token })
                setMessage({ type: 'success', text: 'Profile updated successfully' })
            }

        } catch (err) {
            console.error(err)
            const errorMsg =
                err?.response?.data?.message ??
                err?.message ??
                'Failed to update profile'
            setMessage({ type: 'error', text: errorMsg })
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="p-12 text-center">Loading profile...</div>
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-600">Update your personal information and preferences.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {message.text && (
                    <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Default Currency</label>
                        <p className="mb-2 text-xs text-slate-500">
                            Only affects new records. Existing records retain their currency.
                        </p>
                        <select
                            value={defaultCurrency}
                            onChange={(e) => setDefaultCurrency(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            {currencies.map((currency) => (
                                <option key={currency} value={currency}>
                                    {currency}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="mb-4 text-base font-semibold text-slate-900">Change Password</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current password"
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Changing your password will log you out of all devices.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Profile
