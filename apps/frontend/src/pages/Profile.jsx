import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import useStore from '../store/store'
import { updateUser } from '../services/userService'
import { useUser, userKeys } from '../hooks/queries/useUserQueries'
import { useAvailableCurrencies } from '../hooks/queries/useCurrencyQueries'
import { budgetKeys } from '../hooks/queries/useBudgetQueries'
import { incomeKeys } from '../hooks/queries/useIncomeQueries'
import { expenseKeys } from '../hooks/queries/useExpenseQueries'
import { subscriptionKeys } from '../hooks/queries/useSubscriptionQueries'
import { analyticsKeys } from '../hooks/useChartData'
import LoadingSpinner from '../components/common/LoadingSpinner'
import CurrencySelect from '../components/common/CurrencySelect'
import PasswordInput from '../components/common/PasswordInput'

function Profile() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user: storedUser, logout, updateUserInfo } = useStore((state) => state)

    const userId = useMemo(
        () => storedUser?._id || storedUser?.id || null,
        [storedUser]
    )

    // React Query hooks
    const { data: userData, isLoading: userLoading } = useUser(userId)
    const { data: currencies = ['USD'], isLoading: currenciesLoading } = useAvailableCurrencies()

    // Local form state
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [defaultCurrency, setDefaultCurrency] = useState('USD')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Initialize form when user data loads
    useEffect(() => {
        if (userData) {
            const user = userData?.data?.user || userData?.user || userData
            setName(user.name || '')
            setEmail(user.email || '')
            setDefaultCurrency(user.defaultCurrency || 'USD')
        }
    }, [userData])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            // Get current currency before update to detect changes
            const currentUser = userData?.data?.user || userData?.user || userData
            const previousCurrency = currentUser?.defaultCurrency || 'USD'

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

            // Invalidate user cache
            queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })

            // If currency changed, invalidate all dashboard-related caches
            // so they refetch and display with the new default currency
            if (defaultCurrency !== previousCurrency) {
                queryClient.invalidateQueries({ queryKey: budgetKeys.all })
                queryClient.invalidateQueries({ queryKey: incomeKeys.all })
                queryClient.invalidateQueries({ queryKey: expenseKeys.all })
                queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
                queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
            }

            if (password) {
                // If password was changed, logout and redirect
                logout()
                navigate('/login', { state: { message: 'Password updated. Please log in again.' } })
            } else {
                // Update local store without clearing cache
                updateUserInfo(updatedUser)
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

    if (userLoading || currenciesLoading) {
        return <LoadingSpinner />
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-main">My Profile</h1>
                <p className="text-secondary">Update your personal information and preferences.</p>
            </div>

            <div className="rounded-2xl glass-card p-6 shadow-xl">
                {message.text && (
                    <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-muted">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted">Default Currency</label>
                        <p className="mb-2 text-xs text-slate-500">
                            Only affects new records. Existing records retain their currency.
                        </p>
                        <CurrencySelect
                            value={defaultCurrency}
                            onChange={setDefaultCurrency}
                            currencies={currencies}
                        />
                    </div>

                    <div className="border-t border-slate-700/50 pt-6">
                        <h3 className="mb-4 text-base font-semibold text-main">Change Password</h3>
                        <div>
                            <label className="block text-sm font-medium text-muted">New Password</label>
                            <PasswordInput
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep current password"
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
                            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Admin Dashboard button - only visible for admins */}
            {storedUser?.role === 'admin' && (
                <div className="mt-6 rounded-2xl glass-card p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-main mb-2">Admin Access</h3>
                    <p className="text-sm text-secondary mb-4">
                        You have administrator privileges. Access the admin dashboard to manage users and view analytics.
                    </p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 shadow-lg shadow-violet-500/20 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Dashboard
                    </button>
                </div>
            )}
        </div>
    )
}

export default Profile
