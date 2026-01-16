import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useQueryClient } from '@tanstack/react-query'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ActionButton } from '../components/common/ActionButton'
import { CategoryIcon } from '../components/common/CategoryIcon'
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

const expenseCategories = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Rent',
  'Health',
  'Others',
]

const currencies = ['USD', 'EUR', 'CNY', 'AUD']
const subscriptionCurrencies = currencies
const subscriptionFrequencies = ['daily', 'weekly', 'monthly', 'yearly']
const subscriptionCategories = expenseCategories
const subscriptionStatuses = ['active', 'cancelled', 'expired']
const budgetCategories = expenseCategories
const budgetCurrencies = currencies
const expenseCurrencies = currencies
const incomeCategories = [
  'Salary',
  'Freelance',
  'Gift',
  'Investment',
  'Other',
]
const incomeCurrencies = currencies

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
  const [expenseEdits, setExpenseEdits] = useState({})
  const [subscriptionEdits, setSubscriptionEdits] = useState({})
  const [budgetEdits, setBudgetEdits] = useState({})
  const [incomeEdits, setIncomeEdits] = useState({})

  // Debounce month/year changes - instant on first mount, 500ms delay on subsequent changes
  const debouncedMonth = useDebouncedValue(month, 500)
  const debouncedYear = useDebouncedValue(year, 500)

  const queryClient = useQueryClient()

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
    const payload = expenseEdits[id]
    if (!payload) return

    if (payload.amount === '') {
      setError('Please provide an amount')
      throw new Error('Validation failed')
    }

    // Budget check
    if (payload.date && payload.category) {
      // Parse date string (YYYY-MM-DD) directly to avoid timezone issues
      let expMonth, expYear
      // Handle partial date strings or full ISO strings if they occur (though payload.date is usually YYYY-MM-DD from input)
      if (payload.date.includes('T')) {
        const d = new Date(payload.date)
        expMonth = d.getMonth() + 1
        expYear = d.getFullYear()
      } else {
        const [y, m] = payload.date.split('-')
        expYear = Number(y)
        expMonth = Number(m)
      }

      let relevantBudgets = []
      // If the expense date falls in the currently viewed month/year, we can use the local state
      if (expMonth === month && expYear === year) {
        relevantBudgets = budgets
      } else {
        // Otherwise we need to fetch the budgets for that time period
        try {
          relevantBudgets = await listBudgets({
            month: expMonth,
            year: expYear,
            userId,
          })
        } catch {
          // If fetch fails, we can't verify, so we might choose to block or warn. 
          // For now let's assume empty to result in blocking to be safe?
          // Or strictly follow requirements: "ask them to set a budget first" -> implies blocking.
          relevantBudgets = []
        }
      }

      const budgetExists = relevantBudgets.some(
        (b) => b.category === payload.category
      )

      if (!budgetExists) {
        setError(
          `Please set a budget for ${payload.category} before updating this expense.`
        )
        throw new Error('Budget missing')
      }
    }

    try {
      await updateExpense(id, {
        ...payload,
        amount: Number(payload.amount),
      })
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
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
    const payload = budgetEdits[id]
    if (!payload) return

    if (payload.limit === '') {
      setError('Please provide a limit')
      throw new Error('Validation failed')
    }

    try {
      await updateBudget(id, {
        ...payload,
        limit: Number(payload.limit),
        month: Number(payload.month),
        year: Number(payload.year),
      })
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
      throw err
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
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
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
      throw err
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-indigo-400">Records</p>
        <h1 className="text-3xl font-bold text-main">
          Manage budgets, expenses, and subscriptions
        </h1>
        <p className="text-sm text-secondary">
          Update or delete any record you have created. Budgets, expenses, and incomes are filtered by month/year. Subscriptions show all records.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">Budget month & year</p>
            <p className="text-xs text-secondary">
              Filters budgets, expenses, and incomes. Subscriptions are not filtered.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              Month
              <input
                className="w-24 rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
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
            <label className="flex items-center gap-2 text-sm text-muted">
              Year
              <input
                className="w-28 rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
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
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {error && <p className="text-rose-600 mb-4">{error}</p>}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-main">Budgets</h2>
                <span className="text-sm text-secondary">
                  {budgets.length} for {month}/{year}
                </span>
              </div>
              <div className="space-y-3">
                {budgets.map((budget) => {
                  const id = budget.id || budget._id
                  const form = budgetEdits[id] ?? {}
                  return (
                    <div
                      key={id}
                      className="rounded-xl glass-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={budget.category} className="h-12 w-12" />
                          <div>
                            <p className="text-base font-semibold text-main">
                              {budget.category}
                            </p>
                            <p className="text-sm text-secondary">
                              {budget.month}/{budget.year}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-main">
                            {formatCurrency(
                              budget.limit ?? 0,
                              budget.currency ?? 'USD',
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.category ?? ''}
                          onChange={(e) =>
                            handleBudgetChange(id, 'category', e.target.value)
                          }
                        >
                          <option value="">Select category</option>
                          {budgetCategories.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.currency ?? ''}
                          onChange={(e) =>
                            handleBudgetChange(id, 'currency', e.target.value)
                          }
                        >
                          <option value="">Select currency</option>
                          {budgetCurrencies.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="number"
                          min={0}
                          value={form.limit ?? ''}
                          onChange={(e) =>
                            handleBudgetChange(id, 'limit', e.target.value)
                          }
                          placeholder="Limit"
                        />
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="number"
                          min={1}
                          max={12}
                          value={form.month ?? ''}
                          onChange={(e) =>
                            handleBudgetChange(id, 'month', e.target.value)
                          }
                          placeholder="Month"
                        />
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="number"
                          min={2024}
                          value={form.year ?? ''}
                          onChange={(e) =>
                            handleBudgetChange(id, 'year', e.target.value)
                          }
                          placeholder="Year"
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="mt-3 flex gap-2">
                          <ActionButton
                            onClick={() => handleUpdateBudget(id)}
                            successText="Updated!"
                          >
                            Update
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() => handleDeleteBudget(id)}
                            successText="Deleted!"
                          >
                            Delete
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {budgets.length === 0 ? (
                  <p className="text-sm text-slate-500">No budgets yet</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-main">Expenses</h2>
                <span className="text-sm text-secondary">
                  Total {expenses.length}
                </span>
              </div>
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const id = expense.id || expense._id
                  const form = expenseEdits[id] ?? {}
                  return (
                    <div
                      key={id}
                      className="rounded-xl glass-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={expense.category} name={expense.title} className="h-12 w-12" />
                          <div>
                            <p className="text-base font-semibold text-main">
                              {expense.title}
                            </p>
                            <p className="text-sm text-secondary">
                              {expense.category} ·{' '}
                              {formatDateForDisplay(expense.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-main">
                            {formatCurrency(
                              expense.amount ?? 0,
                              expense.currency ?? 'USD',
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.title ?? ''}
                          onChange={(e) =>
                            handleExpenseChange(id, 'title', e.target.value)
                          }
                          placeholder="Title"
                        />
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="number"
                          value={form.amount ?? ''}
                          onChange={(e) =>
                            handleExpenseChange(id, 'amount', e.target.value)
                          }
                          placeholder="Amount"
                        />
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.category ?? ''}
                          onChange={(e) =>
                            handleExpenseChange(id, 'category', e.target.value)
                          }
                        >
                          <option value="">Select category</option>
                          {expenseCategories.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.currency ?? ''}
                          onChange={(e) =>
                            handleExpenseChange(id, 'currency', e.target.value)
                          }
                        >
                          <option value="">Select currency</option>
                          {expenseCurrencies.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="date"
                          value={form.date ?? ''}
                          onChange={(e) =>
                            handleExpenseChange(id, 'date', e.target.value)
                          }
                        />
                        <textarea
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm sm:col-span-2 text-main focus:border-indigo-500 focus:outline-none"
                          value={form.notes ?? ''}
                          onChange={(e) =>
                            handleExpenseChange(id, 'notes', e.target.value)
                          }
                          placeholder="Notes"
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="mt-3 flex gap-2">
                          <ActionButton
                            onClick={() => handleUpdateExpense(id)}
                            successText="Updated!"
                          >
                            Update
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() => handleDeleteExpense(id)}
                            successText="Deleted!"
                          >
                            Delete
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {expenses.length === 0 ? (
                  <p className="text-sm text-slate-500">No expenses yet</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-main">Subscriptions</h2>
                <span className="text-sm text-secondary">
                  Total {subscriptions.length} (all)
                </span>
              </div>
              <div className="space-y-3">
                {subscriptions.map((subscription) => {
                  const id = subscription.id || subscription._id
                  const form = subscriptionEdits[id] ?? {}
                  return (
                    <div
                      key={id}
                      className="rounded-xl glass-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={subscription.category} name={subscription.name} className="h-12 w-12" />
                          <div>
                            <p className="text-base font-semibold text-main">
                              {subscription.name}
                            </p>
                            <p className="text-sm text-secondary">
                              {subscription.category} · {subscription.frequency}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-main">
                            {formatCurrency(
                              subscription.price ?? 0,
                              subscription.currency ?? 'USD',
                            )}
                          </p>
                          <p className="text-sm text-secondary">
                            Status: {subscription.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.name ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(id, 'name', e.target.value)
                          }
                          placeholder="Name"
                        />
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="number"
                          value={form.price ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(id, 'price', e.target.value)
                          }
                          placeholder="Price"
                        />
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.currency ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(id, 'currency', e.target.value)
                          }
                        >
                          <option value="">Select currency</option>
                          {subscriptionCurrencies.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.frequency ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              id,
                              'frequency',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select frequency</option>
                          {subscriptionFrequencies.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.category ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              id,
                              'category',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select category</option>
                          {subscriptionCategories.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.paymentMethod ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              id,
                              'paymentMethod',
                              e.target.value,
                            )
                          }
                          placeholder="Payment method"
                        />
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.status ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(id, 'status', e.target.value)
                          }
                        >
                          <option value="">Select status</option>
                          {subscriptionStatuses.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="date"
                          value={form.startDate ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              id,
                              'startDate',
                              e.target.value,
                            )
                          }
                        />
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="date"
                          value={form.renewalDate ?? ''}
                          onChange={(e) =>
                            handleSubscriptionChange(
                              id,
                              'renewalDate',
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="mt-3 flex gap-2">
                          <ActionButton
                            onClick={() => handleUpdateSubscription(id)}
                            successText="Updated!"
                          >
                            Update
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() => handleDeleteSubscription(id)}
                            successText="Deleted!"
                          >
                            Delete
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {subscriptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No subscriptions yet</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-main">Incomes</h2>
                <span className="text-sm text-secondary">
                  {incomes.length} for {month}/{year}
                </span>
              </div>
              <div className="space-y-3">
                {incomes.map((income) => {
                  const id = income.id || income._id
                  const form = incomeEdits[id] ?? {}
                  return (
                    <div
                      key={id}
                      className="rounded-xl glass-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                            <span className="text-2xl">💰</span>
                          </div>
                          <div>
                            <p className="text-base font-semibold text-main">
                              {income.category}
                            </p>
                            <p className="text-sm text-secondary">
                              {income.source || 'No source'} · {formatDateForDisplay(income.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-main">
                            {formatCurrency(
                              income.amount ?? 0,
                              income.currency ?? 'USD',
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="number"
                          value={form.amount ?? ''}
                          onChange={(e) =>
                            handleIncomeChange(id, 'amount', e.target.value)
                          }
                          placeholder="Amount"
                        />
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.currency ?? ''}
                          onChange={(e) =>
                            handleIncomeChange(id, 'currency', e.target.value)
                          }
                        >
                          <option value="">Select currency</option>
                          {incomeCurrencies.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.category ?? ''}
                          onChange={(e) =>
                            handleIncomeChange(id, 'category', e.target.value)
                          }
                        >
                          <option value="">Select category</option>
                          {incomeCategories.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          value={form.source ?? ''}
                          onChange={(e) =>
                            handleIncomeChange(id, 'source', e.target.value)
                          }
                          placeholder="Source"
                        />
                        <input
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
                          type="date"
                          value={form.date ?? ''}
                          onChange={(e) =>
                            handleIncomeChange(id, 'date', e.target.value)
                          }
                        />
                        <textarea
                          className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm sm:col-span-2 text-main focus:border-indigo-500 focus:outline-none"
                          value={form.notes ?? ''}
                          onChange={(e) =>
                            handleIncomeChange(id, 'notes', e.target.value)
                          }
                          placeholder="Notes"
                        />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="mt-3 flex gap-2">
                          <ActionButton
                            onClick={() => handleUpdateIncome(id)}
                            successText="Updated!"
                          >
                            Update
                          </ActionButton>
                          <ActionButton
                            variant="danger"
                            onClick={() => handleDeleteIncome(id)}
                            successText="Deleted!"
                          >
                            Delete
                          </ActionButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {incomes.length === 0 ? (
                  <p className="text-sm text-slate-500">No incomes yet</p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Records


