import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion as Motion } from 'framer-motion'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { getBudgetSummary } from '../services/budgetService'
import { getTotalSubscription } from '../services/subscriptionService'
import { getIncomeSummary } from '../services/incomeService'
import { formatCurrency } from '../utils/formatCurrency'
import useStore from '../store/store'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

function Dashboard() {
  const user = useStore((state) => state.user)
  const userId = useMemo(
    () => user?._id || user?.id || user?.userId || null,
    [user],
  )

  // Use store for month/year to persist across page navigations
  const month = useStore((state) => state.selectedMonth)
  const year = useStore((state) => state.selectedYear)
  const setMonth = useStore((state) => state.setSelectedMonth)
  const setYear = useStore((state) => state.setSelectedYear)

  const currency = user?.defaultCurrency || 'USD'
  const [budgetSummary, setBudgetSummary] = useState(null)
  const [subscriptionFee, setSubscriptionFee] = useState(null)
  const [incomeSummary, setIncomeSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Debounce month/year changes - instant on first mount, 500ms delay on subsequent changes
  const debouncedMonth = useDebouncedValue(month, 500)
  const debouncedYear = useDebouncedValue(year, 500)

  useEffect(() => {
    let ignore = false

    const fetchData = async () => {
      if (!userId || !debouncedMonth || !debouncedYear) return
      setLoading(true)
      setError('')
      try {
        const [summaryData, totalSubscription, incomeData] = await Promise.all([
          getBudgetSummary({ month: debouncedMonth, year: debouncedYear, userId }),
          getTotalSubscription({ userId }),
          getIncomeSummary({ month: debouncedMonth, year: debouncedYear }),
        ])

        if (!ignore) {
          setBudgetSummary(summaryData ?? null)
          setSubscriptionFee(
            typeof totalSubscription === 'number' && !Number.isNaN(totalSubscription)
              ? totalSubscription
              : 0,
          )
          setIncomeSummary(incomeData ?? null)
        }
      } catch (err) {
        if (ignore) return
        // Ignore abort errors
        if (err.name === 'CanceledError' || err.name === 'AbortError' || axios.isCancel(err)) {
          return
        }

        const message =
          err?.response?.data?.message ??
          err?.message ??
          'Failed to load data, please try again later'

        setError(message)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      ignore = true
    }
  }, [userId, debouncedMonth, debouncedYear])

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

      {incomeSummary && incomeSummary.totalIncome !== undefined ? (
        <Motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-slate-500">
            Total income in {month}/{year}
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {formatCurrency(incomeSummary.totalIncome ?? 0, currency)}
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
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={item.category} className="h-10 w-10" />
                      <p className="text-base font-semibold text-slate-900">
                        {item.category}
                      </p>
                    </div>
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
        <LoadingSpinner />
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
