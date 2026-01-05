import { useEffect, useMemo, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { getBudgetSummary } from '../services/budgetService'
import { getTotalSubscription } from '../services/subscriptionService'
import { formatCurrency } from '../utils/formatCurrency'
import useStore from '../store/store'

function Dashboard() {
  const user = useStore((state) => state.user)
  const userId = useMemo(
    () => user?._id || user?.id || user?.userId || null,
    [user],
  )

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const currency = user?.defaultCurrency || 'USD'
  const [budgetSummary, setBudgetSummary] = useState(null)
  const [subscriptionFee, setSubscriptionFee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !month || !year) return
      setLoading(true)
      setError('')
      try {
        const [summaryData, totalSubscription] = await Promise.all([
          getBudgetSummary({ month, year }),
          getTotalSubscription({ userId }),
        ])

        setBudgetSummary(summaryData ?? null)
        setSubscriptionFee(
          typeof totalSubscription === 'number' && !Number.isNaN(totalSubscription)
            ? totalSubscription
            : 0,
        )
      } catch (err) {
        const message =
          err?.response?.data?.message ??
          err?.message ??
          'Failed to load data, please try again later'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId, month, year])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <p className="text-sm font-semibold text-slate-600">My bills</p>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.name ?? user?.email ?? 'friend'}
        </h1>
        <p className="text-sm text-slate-600">
          Budget statistics for the selected month/year. Records have moved to the Records page.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Budget month & year</p>
            <p className="text-xs text-slate-500">
              Controls which month/year the stats use. Changing the inputs refreshes data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Month
              <input
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => {
                  const value = e.target.value
                  setMonth(value === '' ? '' : Number(value))
                }}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Year
              <input
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                type="number"
                min={2024}
                value={year}
                onChange={(e) => {
                  const value = e.target.value
                  setYear(value === '' ? '' : Number(value))
                }}
              />
            </label>
          </div>
        </div>
      </Motion.div>

      {subscriptionFee !== null ? (
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-slate-500">
            Subscription fee in {year || new Date().getFullYear()}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(subscriptionFee ?? 0, currency)}
          </p>
        </Motion.div>
      ) : null}

      {budgetSummary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">Total budget</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(budgetSummary.totalBudget ?? 0, currency)}
            </p>
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">Total expenses</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(budgetSummary.totalExpenses ?? 0, currency)}
            </p>
          </Motion.div>
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">Remaining budget</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(budgetSummary.remainingBudget ?? 0, currency)}
            </p>
          </Motion.div>
          <div className="sm:col-span-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Category breakdown
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {(budgetSummary.categoriesSummary ?? []).map((item, idx) => (
                <Motion.div
                  key={item.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-slate-900">
                      {item.category}
                    </p>
                    <span className="text-sm text-slate-500">
                      Budget {formatCurrency(item.budget ?? 0, currency)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Spent {formatCurrency(item.expenses ?? 0, currency)} · Remaining{' '}
                    <span
                      className={
                        item.budget > 0 &&
                          item.remainingBudget / item.budget < 0.1
                          ? 'text-rose-600 font-semibold'
                          : 'text-emerald-700'
                      }
                    >
                      {formatCurrency(item.remainingBudget ?? 0, currency)}
                    </span>
                  </p>
                </Motion.div>
              ))}
              {(budgetSummary.categoriesSummary ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No budget categories yet</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Charts coming soon — reserved space for future analytics and visualizations.
        </div>
      )}
    </div>
  )
}

export default Dashboard
