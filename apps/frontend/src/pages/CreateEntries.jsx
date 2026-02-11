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
import { analyticsKeys } from '../hooks/useChartData'
import { TOP_CURRENCIES } from '../data/currencyNames'
import CurrencySelect from '../components/common/CurrencySelect'
import { useAvailableCurrencies } from '../hooks/queries/useCurrencyQueries'
import BudgetImportModal from '../components/budgets/BudgetImportModal'

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

// Helper function to get today's date in YYYY-MM-DD format for date inputs
const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialSubscription = {
  name: '',
  price: '',
  currency: 'USD',
  frequency: 'monthly',
  category: '',
  paymentMethod: '',
  status: 'active',
  startDate: getTodayString(),
  notes: '',
}

const initialExpense = {
  title: '',
  amount: '',
  currency: 'USD',
  category: '',
  date: getTodayString(),
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
  date: getTodayString(),
  notes: '',
}

function CreateEntries() {
  const user = useStore((state) => state.user)
  const userId = useMemo(  //useMemo is used to prevent the userId from being re-rendered
    () => user?._id || user?.id || user?.userId || null,
    [user],
  )
  const queryClient = useQueryClient()
  const { data: availableCurrencies = TOP_CURRENCIES } = useAvailableCurrencies()

  const defaultCurrency = user?.defaultCurrency || 'USD'

  // Ensure default currency is in the list
  const currencyOptions = useMemo(() => {
    if (!availableCurrencies.includes(defaultCurrency)) {
      return [defaultCurrency, ...availableCurrencies]
    }
    return availableCurrencies
  }, [availableCurrencies, defaultCurrency])

  const [subscriptionForm, setSubscriptionForm] = useState(() => ({
    ...initialSubscription,
    currency: defaultCurrency
  }))
  const [expenseForm, setExpenseForm] = useState(() => ({
    ...initialExpense,
    currency: defaultCurrency
  }))
  const [budgetForm, setBudgetForm] = useState(() => ({
    ...initialBudget,
    currency: defaultCurrency
  }))
  const [incomeForm, setIncomeForm] = useState(() => ({
    ...initialIncome,
    currency: defaultCurrency
  }))
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

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
        notes: subscriptionForm.notes,
      })
      setMessage('Subscription created successfully')
      setIsError(false)
      setSubscriptionForm({ ...initialSubscription, currency: defaultCurrency })
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
      setBudgetForm({ ...initialBudget, currency: defaultCurrency })
      // Invalidate cache so other pages refetch
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
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
      setExpenseForm({ ...initialExpense, currency: defaultCurrency })
      // Invalidate cache so other pages refetch (expense affects budget and analytics too)
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
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
      setIncomeForm({ ...initialIncome, currency: defaultCurrency })
      // Invalidate cache so other pages refetch
      queryClient.invalidateQueries({ queryKey: incomeKeys.all })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
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

        <p className="text-sm font-semibold text-indigo-400">New entries</p>
        <h1 className="text-3xl font-bold text-main">
          Create subscriptions, budgets, and expenses
        </h1>
        <p className="text-sm text-secondary">
          Fill in the details and submit; successful records attach to the current signed-in user.
        </p>
        {message ? (
          <p
            className={`text-sm ${isError ? 'text-error' : 'text-success'}`}
          >
            {message}
          </p>
        ) : null}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((alert, idx) => (
              <p key={idx} className="text-sm text-error font-medium">
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
          className="space-y-4 rounded-2xl glass-card p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-main">Create budget</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/50 hover:border-indigo-400 rounded-lg transition-colors"
              >
                Import from Previous Month
              </button>
              <ActionButton
                onClick={handleCreateBudget}
                disabled={loading}
                successText="Created!"
              >
                Submit
              </ActionButton>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
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
            <CurrencySelect
              value={budgetForm.currency}
              onChange={(value) => handleBudgetChange('currency', value)}
              currencies={currencyOptions}
            />
            <input
              className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
              placeholder="Limit"
              type="number"
              min={0}
              value={budgetForm.limit}
              onChange={(e) => handleBudgetChange('limit', e.target.value)}
              required
            />
            <select
              className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
              value={budgetForm.month}
              onChange={(e) => handleBudgetChange('month', e.target.value)}
              required
            >
              <option value="">Select month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(0, m - 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
              value={budgetForm.year}
              onChange={(e) => handleBudgetChange('year', e.target.value)}
              required
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </motion.form>

        <motion.form
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          onSubmit={handleCreateExpense}
          className="space-y-4 rounded-2xl glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-main">Create expense</h2>
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
              className="w-full rounded-lg bg-slate-800/50 border border-slate-700 px-3 py-2 text-sm text-main focus:border-indigo-500 focus:outline-none"
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
            <CurrencySelect
              className="w-full"
              value={expenseForm.currency}
              onChange={(value) => handleExpenseChange('currency', value)}
              currencies={currencyOptions}
            />
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
          className="space-y-4 rounded-2xl glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-main">Create subscription</h2>
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
            <CurrencySelect
              className="w-full"
              value={subscriptionForm.currency}
              onChange={(value) =>
                handleSubscriptionChange('currency', value)
              }
              currencies={currencyOptions}
            />
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

            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              placeholder="Notes"
              value={subscriptionForm.notes}
              onChange={(e) =>
                handleSubscriptionChange('notes', e.target.value)
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
          className="space-y-4 rounded-2xl glass-card p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-main">Create income</h2>
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
            <CurrencySelect
              className="w-full"
              value={incomeForm.currency}
              onChange={(value) => handleIncomeChange('currency', value)}
              currencies={currencyOptions}
            />
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

      {/* Budget Import Modal */}
      <BudgetImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        targetMonth={budgetForm.month}
        targetYear={budgetForm.year}
        onImportComplete={() => {
          setMessage('Budgets imported successfully')
          setIsError(false)
          queryClient.invalidateQueries({ queryKey: budgetKeys.all })
          queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
        }}
      />
    </div>
  )
}

export default CreateEntries

