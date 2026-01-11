import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ActionButton } from '../components/common/ActionButton'
import { createExpense } from '../services/expenseService'
import { createSubscription } from '../services/subscriptionService'
import { createBudget, listBudgets } from '../services/budgetService'
import { createIncome } from '../services/incomeService'
import useStore from '../store/store'
import { budgetKeys } from '../hooks/queries/useBudgetQueries'
import { expenseKeys } from '../hooks/queries/useExpenseQueries'
import { incomeKeys } from '../hooks/queries/useIncomeQueries'
import { subscriptionKeys } from '../hooks/queries/useSubscriptionQueries'

const currencies = ['USD', 'EUR', 'CNY', 'AUD']
const subscriptionFrequencies = ['daily', 'weekly', 'monthly', 'yearly']
const subscriptionCategories = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Rent',
  'Health',
  'Others',
]
const subscriptionStatuses = ['active', 'cancelled', 'expired']

const expenseCategories = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Rent',
  'Health',
  'Others',
]

const budgetCategories = expenseCategories

const incomeCategories = [
  'Salary',
  'Freelance',
  'Gift',
  'Investment',
  'Other',
]

const initialSubscription = {
  name: '',
  price: '',
  currency: 'USD',
  frequency: 'monthly',
  category: '',
  paymentMethod: '',
  status: 'active',
  startDate: '',
  renewalDate: '',
}

const initialExpense = {
  title: '',
  amount: '',
  currency: 'USD',
  category: '',
  date: '',
  notes: '',
}

const today = new Date()
const initialBudget = {
  category: '',
  limit: '',
  month: today.getMonth() + 1,
  year: today.getFullYear(),
  currency: 'USD',
}

const initialIncome = {
  amount: '',
  currency: 'USD',
  source: '',
  category: '',
  date: '',
  notes: '',
}

function CreateEntries() {
  const user = useStore((state) => state.user)
  const userId = useMemo(  //useMemo is used to prevent the userId from being re-rendered
    () => user?._id || user?.id || user?.userId || null,
    [user],
  )
  const [subscriptionForm, setSubscriptionForm] = useState(initialSubscription)
  const [expenseForm, setExpenseForm] = useState(initialExpense)
  const [budgetForm, setBudgetForm] = useState(initialBudget)
  const [incomeForm, setIncomeForm] = useState(initialIncome)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  const queryClient = useQueryClient()

  const handleSubscriptionChange = (field, value) => {
    setSubscriptionForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleExpenseChange = (field, value) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBudgetChange = (field, value) => {
    setBudgetForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleIncomeChange = (field, value) => {
    setIncomeForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateSubscription = async (event) => {
    if (event) event.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    if (subscriptionForm.price === '') {
      setMessage('Please provide a price')
      setIsError(true)
      setLoading(false)
      throw new Error('Validation failed')
    }

    try {
      await createSubscription({
        ...subscriptionForm,
        price: Number(subscriptionForm.price),
        renewalDate: subscriptionForm.renewalDate || undefined,
      })
      setMessage('Subscription created successfully')
      setIsError(false)
      setSubscriptionForm(initialSubscription)
      // Invalidate cache so other pages refetch
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all })
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to create subscription'
      setMessage(msg)
      setIsError(true)
      throw err // Re-throw to trigger button error state
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBudget = async (event) => {
    if (event) event.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    if (budgetForm.limit === '') {
      setMessage('Please provide a limit')
      setIsError(true)
      setLoading(false)
      throw new Error('Validation failed')
    }

    try {
      await createBudget({
        ...budgetForm,
        limit: Number(budgetForm.limit),
        month: Number(budgetForm.month),
        year: Number(budgetForm.year),
      })
      setMessage('Budget created successfully')
      setIsError(false)
      setBudgetForm(initialBudget)
      // Invalidate cache so other pages refetch
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to create budget'
      setMessage(msg)
      setIsError(true)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (event) => {
    if (event) event.preventDefault()
    setMessage('')
    setIsError(false)

    if (!expenseForm.date || !expenseForm.category) {
      setMessage('Please select a date and category')
      setIsError(true)
      throw new Error('Validation failed')
    }

    if (expenseForm.amount === '') {
      setMessage('Please provide an amount')
      setIsError(true)
      throw new Error('Validation failed')
    }

    setLoading(true)
    try {
      // Parse date string (YYYY-MM-DD) directly to avoid timezone issues of "new Date(string)"
      // which defaults to UTC for hyphenated strings, causing day shifts in local time.
      const [y, m] = expenseForm.date.split('-')
      const year = Number(y)
      const month = Number(m)

      // Check if budget exists for this category and month/year
      const budgets = await listBudgets({ month, year, userId })
      const budgetExists = budgets.some(
        (b) => b.category === expenseForm.category
      )

      if (!budgetExists) {
        const errorMsg = `Please set a budget for ${expenseForm.category} before creating an expense.`
        setMessage(errorMsg)
        setIsError(true)
        setLoading(false)
        throw new Error(errorMsg)
      }

      const response = await createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      })

      setMessage('Expense created successfully')

      if (response && response.alerts && response.alerts.length > 0) {
        setAlerts(
          response.alerts.map(
            (a) => `Alert: You have reached ${a.threshold}% of your ${a.category} budget (Usage: ${a.usage}%).`
          )
        )
      } else {
        setAlerts([])
      }

      setIsError(false)
      setExpenseForm(initialExpense)
      // Invalidate cache so other pages refetch (expense affects budget too)
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to create expense'
      setMessage(msg)
      setIsError(true)
      setAlerts([])
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIncome = async (event) => {
    if (event) event.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    if (incomeForm.amount === '') {
      setMessage('Please provide an amount')
      setIsError(true)
      setLoading(false)
      throw new Error('Validation failed')
    }

    try {
      await createIncome({
        ...incomeForm,
        amount: Number(incomeForm.amount),
      })
      setMessage('Income created successfully')
      setIsError(false)
      setIncomeForm(initialIncome)
      // Invalidate cache so other pages refetch
      queryClient.invalidateQueries({ queryKey: incomeKeys.all })
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to create income'
      setMessage(msg)
      setIsError(true)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-600">New entries</p>
        <h1 className="text-3xl font-bold text-slate-900">
          Create subscriptions, budgets, and expenses
        </h1>
        <p className="text-sm text-slate-600">
          Fill in the details and submit; successful records attach to the current signed-in user.
        </p>
        {message ? (
          <p
            className={`text-sm ${isError ? 'text-rose-600' : 'text-emerald-600'
              }`}
          >
            {message}
          </p>
        ) : null}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((alert, idx) => (
              <p key={idx} className="text-sm text-rose-600 font-medium">
                {alert}
              </p>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="grid gap-8 md:grid-cols-2"
      >
        <motion.form
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          onSubmit={handleCreateBudget}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create budget</h2>
            <ActionButton
              onClick={handleCreateBudget}
              disabled={loading}
              successText="Created!"
            >
              Submit
            </ActionButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={budgetForm.category}
              onChange={(e) => handleBudgetChange('category', e.target.value)}
              required
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
              value={budgetForm.currency}
              onChange={(e) => handleBudgetChange('currency', e.target.value)}
              required
            >
              <option value="">Select currency</option>
              {currencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Limit"
              type="number"
              min={0}
              value={budgetForm.limit}
              onChange={(e) => handleBudgetChange('limit', e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Month (1-12)"
              type="number"
              min={1}
              max={12}
              value={budgetForm.month}
              onChange={(e) => handleBudgetChange('month', e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Year"
              type="number"
              min={2024}
              value={budgetForm.year}
              onChange={(e) => handleBudgetChange('year', e.target.value)}
              required
            />
          </div>
        </motion.form>

        <motion.form
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          onSubmit={handleCreateExpense}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create expense</h2>
            <ActionButton
              onClick={handleCreateExpense}
              disabled={loading}
              successText="Created!"
            >
              Submit
            </ActionButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Title"
              value={expenseForm.title}
              onChange={(e) => handleExpenseChange('title', e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Amount"
              type="number"
              value={expenseForm.amount}
              onChange={(e) => handleExpenseChange('amount', e.target.value)}
              required
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={expenseForm.category}
              onChange={(e) => handleExpenseChange('category', e.target.value)}
              required
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
              value={expenseForm.currency}
              onChange={(e) => handleExpenseChange('currency', e.target.value)}
              required
            >
              <option value="">Select currency</option>
              {currencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="date"
              placeholder="Date"
              value={expenseForm.date}
              onChange={(e) => handleExpenseChange('date', e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Notes"
              value={expenseForm.notes}
              onChange={(e) => handleExpenseChange('notes', e.target.value)}
            />
          </div>
        </motion.form>

        <motion.form
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          onSubmit={handleCreateSubscription}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create subscription</h2>
            <ActionButton
              onClick={handleCreateSubscription}
              disabled={loading}
              successText="Created!"
            >
              Submit
            </ActionButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Name"
              value={subscriptionForm.name}
              onChange={(e) =>
                handleSubscriptionChange('name', e.target.value)
              }
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Price"
              type="number"
              value={subscriptionForm.price}
              onChange={(e) =>
                handleSubscriptionChange('price', e.target.value)
              }
              required
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={subscriptionForm.currency}
              onChange={(e) =>
                handleSubscriptionChange('currency', e.target.value)
              }
              required
            >
              <option value="">Select currency</option>
              {currencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={subscriptionForm.frequency}
              onChange={(e) =>
                handleSubscriptionChange('frequency', e.target.value)
              }
              required
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
              value={subscriptionForm.category}
              onChange={(e) =>
                handleSubscriptionChange('category', e.target.value)
              }
              required
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
              placeholder="Payment method"
              value={subscriptionForm.paymentMethod}
              onChange={(e) =>
                handleSubscriptionChange('paymentMethod', e.target.value)
              }
              required
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={subscriptionForm.status}
              onChange={(e) =>
                handleSubscriptionChange('status', e.target.value)
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
              placeholder="Start date"
              value={subscriptionForm.startDate}
              onChange={(e) =>
                handleSubscriptionChange('startDate', e.target.value)
              }
              required
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="date"
              placeholder="Renewal date"
              value={subscriptionForm.renewalDate}
              onChange={(e) =>
                handleSubscriptionChange('renewalDate', e.target.value)
              }
            />
          </div>
        </motion.form>

        <motion.form
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          onSubmit={handleCreateIncome}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create income</h2>
            <ActionButton
              onClick={handleCreateIncome}
              disabled={loading}
              successText="Created!"
            >
              Submit
            </ActionButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Amount"
              type="number"
              value={incomeForm.amount}
              onChange={(e) => handleIncomeChange('amount', e.target.value)}
              required
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={incomeForm.currency}
              onChange={(e) => handleIncomeChange('currency', e.target.value)}
              required
            >
              <option value="">Select currency</option>
              {currencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={incomeForm.category}
              onChange={(e) => handleIncomeChange('category', e.target.value)}
              required
            >
              <option value="">Select category</option>
              {incomeCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Source (optional)"
              value={incomeForm.source}
              onChange={(e) => handleIncomeChange('source', e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="date"
              placeholder="Date"
              value={incomeForm.date}
              onChange={(e) => handleIncomeChange('date', e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Notes"
              value={incomeForm.notes}
              onChange={(e) => handleIncomeChange('notes', e.target.value)}
            />
          </div>
        </motion.form>
      </motion.div>
    </div>
  )
}

export default CreateEntries

