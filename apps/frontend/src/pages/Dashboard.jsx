import { useMemo, useState } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion as Motion } from 'framer-motion'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { formatCurrency } from '../utils/formatCurrency'
import useStore from '../store/store'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useBudgetSummary } from '../hooks/queries/useBudgetQueries'
import { useTotalSubscription } from '../hooks/queries/useSubscriptionQueries'
import { useIncomeSummary } from '../hooks/queries/useIncomeQueries'

// Chart components
import {
  TrendLineChart,
  CategoryPieChart,
  BudgetProgressBars,
  MonthlyComparisonChart
} from '../components/charts'
import ChartSkeleton from '../components/common/ChartSkeleton'

// Chart data hooks (mock data for now)
import {
  useTrendData,
  useCategoryBreakdown,
  useMonthlyComparison,
  useBudgetUsage
} from '../hooks/useChartData'

// Trend granularity options
const GRANULARITY_OPTIONS = [
  { value: 'weekly', label: 'Weekly (12 weeks)' },
  { value: 'monthly', label: 'Monthly (12 months)' },
  { value: 'yearly', label: 'Yearly (12 years)' }
]

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

  // Trend chart granularity state
  const [trendGranularity, setTrendGranularity] = useState('monthly')

  const currency = user?.defaultCurrency || 'USD'

  // Debounce month/year changes - instant on first mount, 500ms delay on subsequent changes
  const debouncedMonth = useDebouncedValue(month, 500)
  const debouncedYear = useDebouncedValue(year, 500)

  // React Query hooks - automatically handle loading, caching, and errors
  const {
    data: budgetSummary,
    isLoading: budgetLoading,
    error: budgetError
  } = useBudgetSummary({
    month: debouncedMonth,
    year: debouncedYear,
    userId
  })

  const {
    data: subscriptionFee,
    isLoading: subscriptionLoading
  } = useTotalSubscription({ userId })

  const {
    data: incomeSummary,
    isLoading: incomeLoading
  } = useIncomeSummary({
    month: debouncedMonth,
    year: debouncedYear
  })

  // Chart data hooks - using selected month/year for category breakdown
  // Trend: uses granularity selector (weekly/monthly/yearly, 12 periods each)
  // Trend: uses granularity selector (weekly/monthly/yearly, 12 periods each)
  const { data: trendData, isLoading: trendLoading } = useTrendData({ granularity: trendGranularity, count: 12 })
  // Category breakdown: uses selected month/year from dashboard
  const { data: categoryData, isLoading: categoryLoading } = useCategoryBreakdown({
    type: 'expense',
    month: debouncedMonth,
    year: debouncedYear
  })
  // Monthly comparison: 6 most recent months
  const { data: comparisonData, isLoading: comparisonLoading } = useMonthlyComparison({ months: 6 })
  // Budget usage: uses selected month/year, with budgetSummary as fallback
  const { data: budgetUsageData, isLoading: budgetUsageLoading } = useBudgetUsage({
    month: debouncedMonth,
    year: debouncedYear,
    budgetSummary
  })

  const loading = budgetLoading || subscriptionLoading || incomeLoading
  const error = budgetError?.message || ''

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* Header */}
      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <p className="text-sm font-semibold text-indigo-400">My bills</p>
        <h1 className="text-3xl font-bold text-main">
          Welcome back, {user?.name ?? user?.email ?? 'friend'}
        </h1>
        <p className="text-sm text-secondary">
          Budget statistics for the selected month/year. Records have moved to the Records page.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">Budget month & year</p>
            <p className="text-xs text-slate-500">
              Controls which month/year the stats use. Changing the inputs refreshes data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              Month
              <select
                className="w-24 px-3 py-2 text-sm"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              Year
              <select
                className="w-28 px-3 py-2 text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Motion.div>

      {/* Summary Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {subscriptionFee !== undefined && subscriptionFee !== null ? (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl glass-card p-4"
          >
            <p className="text-sm text-secondary">
              Subscription fee in {year || new Date().getFullYear()}
            </p>
            <p className="mt-2 text-2xl font-semibold text-main">
              {formatCurrency(subscriptionFee ?? 0, currency)}
            </p>
          </Motion.div>
        ) : null}

        {incomeSummary && incomeSummary.totalIncome !== undefined ? (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl glass-card p-4"
          >
            <p className="text-sm text-secondary">
              Total income in {month}/{year}
            </p>
            <p className="mt-2 text-2xl font-semibold text-main">
              {formatCurrency(incomeSummary.totalIncome ?? 0, currency)}
            </p>
          </Motion.div>
        ) : null}

        {budgetSummary ? (
          <>
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl glass-card p-4"
            >
              <p className="text-sm text-secondary">Total expenses</p>
              <p className="mt-2 text-2xl font-semibold text-main">
                {formatCurrency(budgetSummary.totalExpenses ?? 0, currency)}
              </p>
            </Motion.div>
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl glass-card p-4"
            >
              <p className="text-sm text-secondary">Remaining budget</p>
              <p className="mt-2 text-2xl font-semibold text-main">
                {formatCurrency(budgetSummary.remainingBudget ?? 0, currency)}
              </p>
            </Motion.div>
          </>
        ) : null}
      </div>

      {/* Loading / Error States */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <>
          {/* Row 1: Trend Line Chart with Granularity Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-main">Income & Expense Trend</h3>
              <select
                className="rounded-lg px-3 py-2 text-sm"
                value={trendGranularity}
                onChange={(e) => setTrendGranularity(e.target.value)}
              >
                {GRANULARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {trendLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <TrendLineChart
                data={trendData}
                title=""
                height={280}
              />
            )}
          </div>

          {/* Row 2: Pie Chart + Budget Progress */}
          <div className="grid gap-6 lg:grid-cols-2">
            {categoryLoading ? (
              <ChartSkeleton height={300} />
            ) : (
              <CategoryPieChart
                data={categoryData}
                title={`Expense Breakdown (${debouncedMonth}/${debouncedYear})`}
                height={300}
              />
            )}

            {budgetUsageLoading ? (
              <ChartSkeleton height={300} />
            ) : (
              <BudgetProgressBars
                data={budgetUsageData}
                title={`Budget Usage (${debouncedMonth}/${debouncedYear})`}
                currency={currency}
              />
            )}
          </div>

          {/* Row 3: Monthly Comparison Chart (Full Width) */}
          {comparisonLoading ? (
            <ChartSkeleton height={300} />
          ) : (
            <MonthlyComparisonChart
              data={comparisonData}
              title="Monthly Comparison"
              height={300}
            />
          )}

          {/* Legacy Category Breakdown (kept for detailed view) */}
          {budgetSummary?.categoriesSummary?.length > 0 && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-main">
                Detailed Category Breakdown
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {budgetSummary.categoriesSummary.map((item, idx) => (
                  <Motion.div
                    key={item.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="rounded-xl glass-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={item.category} className="h-10 w-10 text-slate-200" />
                        <p className="text-base font-semibold text-main">
                          {item.category}
                        </p>
                      </div>
                      <span className="text-sm text-secondary">
                        Budget {formatCurrency(item.budget ?? 0, currency)}
                      </span>
                    </div>
                    <p className="text-sm text-secondary">
                      Spent {formatCurrency(item.expenses ?? 0, currency)} · Remaining{' '}
                      <span
                        className={
                          item.budget > 0 &&
                            item.remainingBudget / item.budget < 0.1
                            ? 'text-rose-400 font-semibold'
                            : 'text-emerald-400'
                        }
                      >
                        {formatCurrency(item.remainingBudget ?? 0, currency)}
                      </span>
                    </p>
                  </Motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard

