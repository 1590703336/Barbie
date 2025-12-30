import { useEffect, useMemo, useState } from 'react'
import {
  deleteExpense,
  listExpenses,
  updateExpense,
} from '../services/expenseService'
import {
  deleteSubscription,
  getUserSubscriptions,
  updateSubscription,
} from '../services/subscriptionService'
import {
  deleteBudget,
  listBudgets,
  updateBudget,
} from '../services/budgetService'
import { formatCurrency } from '../utils/formatCurrency'
import useStore from '../store/store'

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

const formatDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function Records() {
  const user = useStore((state) => state.user)
  const userId = useMemo(
    () => user?._id || user?.id || user?.userId || null,
    [user],
  )

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [expenses, setExpenses] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expenseEdits, setExpenseEdits] = useState({})
  const [subscriptionEdits, setSubscriptionEdits] = useState({})
  const [budgetEdits, setBudgetEdits] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !month || !year) return
      setLoading(true)
      setError('')
      try {
        const [expenseData, subscriptionData, budgetData] = await Promise.all([
          listExpenses(),
          getUserSubscriptions(userId),
          listBudgets({ month, year, userId }),
        ])
        const normalizedExpenses = Array.isArray(expenseData) ? expenseData : []
        const normalizedSubscriptions = Array.isArray(subscriptionData)
          ? subscriptionData
          : []
        const normalizedBudgets = Array.isArray(budgetData) ? budgetData : []

        setExpenses(normalizedExpenses)
        setSubscriptions(normalizedSubscriptions)
        setBudgets(normalizedBudgets)

        setExpenseEdits(
          Object.fromEntries(
            normalizedExpenses.map((item) => {
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
        setSubscriptionEdits(
          Object.fromEntries(
            normalizedSubscriptions.map((item) => {
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
        setBudgetEdits(
          Object.fromEntries(
            normalizedBudgets.map((item) => {
              const id = item.id || item._id
              return [
                id,
                {
                  category: item.category ?? '',
                  limit: item.limit ?? '',
                  month: item.month ?? month,
                  year: item.year ?? year,
                  currency: item.currency ?? 'USD',
                },
              ]
            }),
          ),
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

  const handleUpdateExpense = async (id) => {
    const payload = expenseEdits[id]
    if (!payload) return
    try {
      const updated = await updateExpense(id, {
        ...payload,
        amount: Number(payload.amount),
      })
      setExpenses((prev) =>
        prev.map((item) => (item.id === id || item._id === id ? updated : item)),
      )
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
    }
  }

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id)
      setExpenses((prev) =>
        prev.filter((item) => item.id !== id && item._id !== id),
      )
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
    }
  }

  const handleUpdateSubscription = async (id) => {
    const payload = subscriptionEdits[id]
    if (!payload) return
    try {
      const updated = await updateSubscription(id, {
        ...payload,
        price: Number(payload.price),
      })
      const updatedData = updated?.subscription ?? updated
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id ? updatedData : item,
        ),
      )
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
    }
  }

  const handleDeleteSubscription = async (id) => {
    try {
      await deleteSubscription(id)
      setSubscriptions((prev) =>
        prev.filter((item) => item.id !== id && item._id !== id),
      )
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
    }
  }

  const handleUpdateBudget = async (id) => {
    const payload = budgetEdits[id]
    if (!payload) return
    try {
      const updated = await updateBudget(id, {
        ...payload,
        limit: Number(payload.limit),
        month: Number(payload.month),
        year: Number(payload.year),
      })
      const updatedBudget = updated?.data ?? updated
      setBudgets((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id ? updatedBudget : item,
        ),
      )
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Update failed'
      setError(message)
    }
  }

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id)
      setBudgets((prev) =>
        prev.filter((item) => item.id !== id && item._id !== id),
      )
    } catch (err) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Delete failed'
      setError(message)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-600">Records</p>
        <h1 className="text-3xl font-bold text-slate-900">
          Manage budgets, expenses, and subscriptions
        </h1>
        <p className="text-sm text-slate-600">
          Update or delete any record you have created. Budgets follow the selected month/year.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Budget month & year</p>
            <p className="text-xs text-slate-500">
              Affects budget list only; expenses/subscriptions are unaffected.
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
      </div>

      {loading ? (
        <p className="text-slate-600">Loading...</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Budgets</h2>
              <span className="text-sm text-slate-500">
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
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {budget.category}
                        </p>
                        <p className="text-sm text-slate-500">
                          {budget.month}/{budget.year}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(
                            budget.limit ?? 0,
                            budget.currency ?? 'USD',
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        type="number"
                        min={0}
                        value={form.limit ?? ''}
                        onChange={(e) =>
                          handleBudgetChange(id, 'limit', e.target.value)
                        }
                        placeholder="Limit"
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                      <button
                        className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                        onClick={() => handleUpdateBudget(id)}
                      >
                        Update
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 px-3 py-2 text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteBudget(id)}
                      >
                        Delete
                      </button>
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
              <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
              <span className="text-sm text-slate-500">
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
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {expense.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {expense.category} ·{' '}
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString()
                            : 'No date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(
                            expense.amount ?? 0,
                            expense.currency ?? 'USD',
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={form.title ?? ''}
                        onChange={(e) =>
                          handleExpenseChange(id, 'title', e.target.value)
                        }
                        placeholder="Title"
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        type="number"
                        value={form.amount ?? ''}
                        onChange={(e) =>
                          handleExpenseChange(id, 'amount', e.target.value)
                        }
                        placeholder="Amount"
                      />
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        type="date"
                        value={form.date ?? ''}
                        onChange={(e) =>
                          handleExpenseChange(id, 'date', e.target.value)
                        }
                      />
                      <textarea
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                        value={form.notes ?? ''}
                        onChange={(e) =>
                          handleExpenseChange(id, 'notes', e.target.value)
                        }
                        placeholder="Notes"
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                        onClick={() => handleUpdateExpense(id)}
                      >
                        Update
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 px-3 py-2 text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteExpense(id)}
                      >
                        Delete
                      </button>
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
              <h2 className="text-lg font-semibold text-slate-900">Subscriptions</h2>
              <span className="text-sm text-slate-500">
                Total {subscriptions.length}
              </span>
            </div>
            <div className="space-y-3">
              {subscriptions.map((subscription) => {
                const id = subscription.id || subscription._id
                const form = subscriptionEdits[id] ?? {}
                return (
                  <div
                    key={id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {subscription.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {subscription.category} · {subscription.frequency}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(
                            subscription.price ?? 0,
                            subscription.currency ?? 'USD',
                          )}
                        </p>
                        <p className="text-sm text-slate-500">
                          Status: {subscription.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={form.name ?? ''}
                        onChange={(e) =>
                          handleSubscriptionChange(id, 'name', e.target.value)
                        }
                        placeholder="Name"
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        type="number"
                        value={form.price ?? ''}
                        onChange={(e) =>
                          handleSubscriptionChange(id, 'price', e.target.value)
                        }
                        placeholder="Price"
                      />
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                      <button
                        className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                        onClick={() => handleUpdateSubscription(id)}
                      >
                        Update
                      </button>
                      <button
                        className="rounded-lg border border-rose-200 px-3 py-2 text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteSubscription(id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
              {subscriptions.length === 0 ? (
                <p className="text-sm text-slate-500">No subscriptions yet</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Records


