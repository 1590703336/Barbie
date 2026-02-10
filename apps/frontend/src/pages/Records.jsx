import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useQueryClient } from '@tanstack/react-query'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ActionButton } from '../components/common/ActionButton'
import { CategoryIcon } from '../components/common/CategoryIcon'
import RecordModal from '../components/common/RecordModal'
import {
  updateExpense,
  deleteExpense,
} from '../services/expenseService'
import {
  updateSubscription,
  deleteSubscription,
} from '../services/subscriptionService'
import {
  listBudgets,
  updateBudget,
  deleteBudget,
} from '../services/budgetService'
import {
  updateIncome,
  deleteIncome,
} from '../services/incomeService'
import { formatCurrency } from '../utils/formatCurrency'
import useStore from '../store/store'
import { useExpenseList } from '../hooks/queries/useExpenseQueries'
import { useBudgetList, budgetKeys } from '../hooks/queries/useBudgetQueries'
import { useIncomeList, incomeKeys } from '../hooks/queries/useIncomeQueries'
import { useUserSubscriptions, subscriptionKeys } from '../hooks/queries/useSubscriptionQueries'
import { expenseKeys } from '../hooks/queries/useExpenseQueries'
import { analyticsKeys } from '../hooks/useChartData'
import { TOP_CURRENCIES } from '../data/currencyNames'
import { useAvailableCurrencies } from '../hooks/queries/useCurrencyQueries'

const expenseCategories = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Rent',
  'Health',
  'Others',
]

const subscriptionFrequencies = ['daily', 'weekly', 'monthly', 'yearly']
const subscriptionCategories = expenseCategories
const subscriptionStatuses = ['active', 'cancelled', 'expired']
const budgetCategories = expenseCategories

const incomeCategories = [
  'Salary',
  'Freelance',
  'Gift',
  'Investment',
  'Other',
]

const formatDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const formatDateForDisplay = (value) => {
  if (!value) return 'No date'
  const date = new Date(value)
  // Adjust for timezone offset to display UTC date as local date
  const userTimezoneOffset = date.getTimezoneOffset() * 60000
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset)
  return adjustedDate.toLocaleDateString()
}



function Records() {
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

  const [error, setError] = useState('')
  const [alerts, setAlerts] = useState([])
  const [expenseEdits, setExpenseEdits] = useState({})
  const [subscriptionEdits, setSubscriptionEdits] = useState({})
  const [budgetEdits, setBudgetEdits] = useState({})
  const [incomeEdits, setIncomeEdits] = useState({})

  // Debounce month/year changes - instant on first mount, 500ms delay on subsequent changes
  const debouncedMonth = useDebouncedValue(month, 500)
  const debouncedYear = useDebouncedValue(year, 500)


  const queryClient = useQueryClient()
  const { data: currencyList = TOP_CURRENCIES } = useAvailableCurrencies()

  // React Query hooks for data fetching
  const { data: expenses = [], isLoading: expensesLoading } = useExpenseList({
    month: debouncedMonth,
    year: debouncedYear,
    userId,
  })

  const { data: budgets = [], isLoading: budgetsLoading } = useBudgetList({
    month: debouncedMonth,
    year: debouncedYear,
    userId,
  })

  const { data: incomes = [], isLoading: incomesLoading } = useIncomeList({
    month: debouncedMonth,
    year: debouncedYear,
    userId,
  })

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useUserSubscriptions(userId)

  const loading = expensesLoading || budgetsLoading || incomesLoading || subscriptionsLoading

  // Initialize edit states when data changes
  useEffect(() => {
    setExpenseEdits(
      Object.fromEntries(
        expenses.map((item) => {
          const id = item.id || item._id
          return [
            id,
            {
              title: item.title ?? '',
              amount: item.amount ?? '',
              currency: item.currency ?? 'USD',
              category: item.category ?? '',
              date: formatDateInput(item.date),
              notes: item.notes ?? '',
            },
          ]
        }),
      ),
    )
  }, [expenses])

  useEffect(() => {
    setSubscriptionEdits(
      Object.fromEntries(
        subscriptions.map((item) => {
          const id = item.id || item._id
          return [
            id,
            {
              name: item.name ?? '',
              price: item.price ?? '',
              currency: item.currency ?? 'USD',
              frequency: item.frequency ?? '',
              category: item.category ?? '',
              paymentMethod: item.paymentMethod ?? '',
              status: item.status ?? 'active',
              startDate: formatDateInput(item.startDate),
              renewalDate: formatDateInput(item.renewalDate),
            },
          ]
        }),
      ),
    )
  }, [subscriptions])

  useEffect(() => {
    setBudgetEdits(
      Object.fromEntries(
        budgets.map((item) => {
          const id = item.id || item._id
          return [
            id,
            {
              category: item.category ?? '',
              limit: item.limit ?? '',
              month: item.month ?? debouncedMonth,
              year: item.year ?? debouncedYear,
              currency: item.currency ?? 'USD',
            },
          ]
        }),
      ),
    )
  }, [budgets, debouncedMonth, debouncedYear])

  useEffect(() => {
    setIncomeEdits(
      Object.fromEntries(
        incomes.map((item) => {
          const id = item.id || item._id
          return [
            id,
            {
              amount: item.amount ?? '',
              currency: item.currency ?? 'USD',
              source: item.source ?? '',
              category: item.category ?? '',
              date: formatDateInput(item.date),
              notes: item.notes ?? '',
            },
          ]
        }),
      ),
    )
  }, [incomes])

  const handleExpenseChange = (id, field, value) => {
    setExpenseEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }))
  }

  const handleSubscriptionChange = (id, field, value) => {
    setSubscriptionEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }))
  }

  const handleBudgetChange = (id, field, value) => {
    setBudgetEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }))
  }

  const handleIncomeChange = (id, field, value) => {
    setIncomeEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }))
  }

  const handleUpdateExpense = async (id) => {
    setError('')
    setAlerts([])
    const payload = expenseEdits[id]
    if (!payload) return

    if (payload.amount === '') {
      setError('Please provide an amount')
      throw new Error('Validation failed')
    }

    try {
      const response = await updateExpense(id, {
        ...payload,
        amount: Number(payload.amount),
      })

      // Display alerts from backend if any
      if (response && response.alerts && response.alerts.length > 0) {
        setAlerts(
          response.alerts.map(
            (a) => `Alert: You have reached ${a.threshold}% of your ${a.category} budget (Usage: ${a.usage}%).`
          )
        )
      } else {
        setAlerts([])
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
      setAlerts([])
      throw err
    }
  }

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id)
      // Wait a moment so user sees the success animation before the item vanishes
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
      throw err
    }
  }

  const handleUpdateSubscription = async (id) => {
    setError('')
    const payload = subscriptionEdits[id]
    if (!payload) return

    if (payload.price === '') {
      setError('Please provide a price')
      throw new Error('Validation failed')
    }

    try {
      await updateSubscription(id, {
        ...payload,
        price: Number(payload.price),
      })
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
      throw err
    }
  }

  const handleDeleteSubscription = async (id) => {
    try {
      await deleteSubscription(id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
      throw err
    }
  }

  const handleUpdateBudget = async (id) => {
    setError('')
    setAlerts([])
    const payload = budgetEdits[id]
    if (!payload) return

    if (payload.limit === '') {
      setError('Please provide a limit')
      throw new Error('Validation failed')
    }

    try {
      const response = await updateBudget(id, {
        ...payload,
        limit: Number(payload.limit),
        month: Number(payload.month),
        year: Number(payload.year),
      })

      // Display alerts from backend if any
      if (response && response.alerts && response.alerts.length > 0) {
        setAlerts(
          response.alerts.map(
            (a) => `Alert: You have reached ${a.threshold}% of your ${a.category} budget (Usage: ${a.usage}%).`
          )
        )
      } else {
        setAlerts([])
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
      setAlerts([])
      throw err
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
      throw err
    }
  }

  const handleUpdateIncome = async (id) => {
    setError('')
    const payload = incomeEdits[id]
    if (!payload) return

    if (payload.amount === '') {
      setError('Please provide an amount')
      throw new Error('Validation failed')
    }

    try {
      await updateIncome(id, {
        ...payload,
        amount: Number(payload.amount),
      })
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: incomeKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
      throw err
    }
  }

  const handleDeleteIncome = async (id) => {
    try {
      await deleteIncome(id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: incomeKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
      throw err
    }
  }
  const [editingId, setEditingId] = useState(null)
  const [editingType, setEditingType] = useState(null) // 'budget' | 'expense' | 'subscription' | 'income'

  const openEditModal = (id, type) => {
    setError('')
    setEditingId(id)
    setEditingType(type)
  }

  const closeEditModal = () => {
    setEditingId(null)
    setEditingType(null)
  }

  const getModalData = () => {
    if (!editingId) return {}
    let data = {}
    switch (editingType) {
      case 'budget': data = budgetEdits[editingId] || {}; break
      case 'expense': data = expenseEdits[editingId] || {}; break
      case 'subscription': data = subscriptionEdits[editingId] || {}; break
      case 'income': data = incomeEdits[editingId] || {}; break
    }
    return { ...data, error }
  }

  const getModalOptions = () => {
    switch (editingType) {
      case 'budget':
        return { categories: budgetCategories, currencies: currencyList }
      case 'expense':
        return { categories: expenseCategories, currencies: currencyList }
      case 'subscription':
        return {
          categories: subscriptionCategories,
          currencies: currencyList,
          frequencies: subscriptionFrequencies,
          statuses: subscriptionStatuses
        }
      case 'income':
        return { categories: incomeCategories, currencies: currencyList }
      default:
        return {}
    }
  }

  const handleModalChange = (field, value) => {
    if (!editingId) return
    switch (editingType) {
      case 'budget': handleBudgetChange(editingId, field, value); break
      case 'expense': handleExpenseChange(editingId, field, value); break
      case 'subscription': handleSubscriptionChange(editingId, field, value); break
      case 'income': handleIncomeChange(editingId, field, value); break
    }
  }

  const handleModalSave = async () => {
    if (!editingId) return
    switch (editingType) {
      case 'budget': await handleUpdateBudget(editingId); break
      case 'expense': await handleUpdateExpense(editingId); break
      case 'subscription': await handleUpdateSubscription(editingId); break
      case 'income': await handleUpdateIncome(editingId); break
    }
  }

  const handleModalDelete = async () => {
    if (!editingId) return
    switch (editingType) {
      case 'budget': await handleDeleteBudget(editingId); break
      case 'expense': await handleDeleteExpense(editingId); break
      case 'subscription': await handleDeleteSubscription(editingId); break
      case 'income': await handleDeleteIncome(editingId); break
    }
  }

  const [activeTab, setActiveTab] = useState('expenses') // 'budgets' | 'expenses' | 'subscriptions' | 'incomes'

  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'budgets', label: 'Budgets', icon: '📊' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '🔄' },
    { id: 'incomes', label: 'Incomes', icon: '💰' },
  ]

  // Common List Item Component
  const ListItem = ({ icon, title, subtitle, amount, date, onClick, status }) => (
    <div
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl hover:bg-white/5 transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm font-medium text-main group-hover:text-indigo-400 transition-colors">{title}</p>
          <div className="flex items-center gap-2 text-xs text-secondary">
            {subtitle}
            {date && (
              <>
                <span>·</span>
                <span>{date}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-main">{amount}</p>
        {status && (
          <p className={`text-[10px] uppercase tracking-wider font-semibold ${status === 'active' ? 'text-emerald-500' : 'text-rose-500'
            }`}>
            {status}
          </p>
        )}
      </div>
    </div>
  )

  // Section Header Component
  const SectionHeader = ({ title, count }) => (
    <div className="flex items-center justify-between py-2 px-1">
      <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider">{title}</h2>
      <span className="text-xs text-secondary bg-[var(--bg-deep)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)]">
        {count}
      </span>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header Section - Restored to Top */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-main">Records</h1>
          <p className="text-sm text-secondary max-w-xl">
            Manage your financial data. Switch between categories using the sidebar.
          </p>
        </div>

        {/* Filters - Restored to Top */}
        <div className="flex items-center gap-3">
          <select
            className="w-32 bg-transparent border-none py-1.5 px-3 text-sm text-main focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <div className="h-4 w-[1px] bg-[var(--border-subtle)]"></div>
          <select
            className="w-24 bg-transparent border-none py-1.5 px-3 text-sm text-main focus:ring-0 cursor-pointer hover:text-indigo-400 transition-colors"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-secondary hover:text-main hover:bg-white/5 border border-transparent'
                  }`}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[400px]">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                    {error}
                  </div>
                )}
                {alerts.length > 0 && (
                  <div className="space-y-1">
                    {alerts.map((alert, idx) => (
                      <p key={idx} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium">
                        {alert}
                      </p>
                    ))}
                  </div>
                )}

                {/* Budgets Section */}
                {activeTab === 'budgets' && (
                  <div className="space-y-3">
                    <SectionHeader title="Budgets" count={budgets.length} />
                    <div className="space-y-3">
                      {budgets.length > 0 ? (
                        budgets.map((budget) => (
                          <ListItem
                            key={budget.id || budget._id}
                            onClick={() => openEditModal(budget.id || budget._id, 'budget')}
                            icon={<CategoryIcon category={budget.category} className="w-10 h-10" />}
                            title={budget.category}
                            subtitle={`${new Date(0, budget.month - 1).toLocaleString('default', { month: 'long' })} ${budget.year}`}
                            amount={formatCurrency(budget.limit ?? 0, budget.currency ?? 'USD')}
                          />
                        ))
                      ) : (
                        <div className="p-12 text-center text-secondary text-sm bg-[var(--bg-panel)] rounded-2xl">
                          No budgets found for this period.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expenses Section */}
                {activeTab === 'expenses' && (
                  <div className="space-y-3">
                    <SectionHeader title="Expenses" count={expenses.length} />
                    <div className="space-y-3">
                      {expenses.length > 0 ? (
                        expenses.map((expense) => (
                          <ListItem
                            key={expense.id || expense._id}
                            onClick={() => openEditModal(expense.id || expense._id, 'expense')}
                            icon={<CategoryIcon category={expense.category} name={expense.title} className="w-10 h-10" />}
                            title={expense.title}
                            subtitle={expense.category}
                            date={formatDateForDisplay(expense.date)}
                            amount={formatCurrency(expense.amount ?? 0, expense.currency ?? 'USD')}
                          />
                        ))
                      ) : (
                        <div className="p-12 text-center text-secondary text-sm bg-[var(--bg-panel)] rounded-2xl">
                          No expenses found for this period.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subscriptions Section */}
                {activeTab === 'subscriptions' && (
                  <div className="space-y-3">
                    <SectionHeader title="Subscriptions" count={subscriptions.length} />
                    <div className="space-y-3">
                      {subscriptions.length > 0 ? (
                        subscriptions.map((sub) => (
                          <ListItem
                            key={sub.id || sub._id}
                            onClick={() => openEditModal(sub.id || sub._id, 'subscription')}
                            icon={<CategoryIcon category={sub.category} name={sub.name} className="w-10 h-10" />}
                            title={sub.name}
                            subtitle={`${sub.category} · ${sub.frequency}`}
                            status={sub.status}
                            amount={formatCurrency(sub.price ?? 0, sub.currency ?? 'USD')}
                          />
                        ))
                      ) : (
                        <div className="p-12 text-center text-secondary text-sm bg-[var(--bg-panel)] rounded-2xl">
                          No subscriptions found.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Income Section */}
                {activeTab === 'incomes' && (
                  <div className="space-y-3">
                    <SectionHeader title="Incomes" count={incomes.length} />
                    <div className="space-y-3">
                      {incomes.length > 0 ? (
                        incomes.map((income) => (
                          <ListItem
                            key={income.id || income._id}
                            onClick={() => openEditModal(income.id || income._id, 'income')}
                            icon={<div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">💰</div>}
                            title={income.category}
                            subtitle={income.source || 'No source'}
                            date={formatDateForDisplay(income.date)}
                            amount={formatCurrency(income.amount ?? 0, income.currency ?? 'USD')}
                          />
                        ))
                      ) : (
                        <div className="p-12 text-center text-secondary text-sm bg-[var(--bg-panel)] rounded-2xl">
                          No incomes found for this period.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      <RecordModal
        isOpen={!!editingId}
        onClose={closeEditModal}
        type={editingType}
        data={getModalData()}
        options={getModalOptions()}
        onChange={handleModalChange}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </div>
  )
}

export default Records


