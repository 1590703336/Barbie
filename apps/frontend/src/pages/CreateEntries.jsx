import { useState } from 'react'
import { createExpense } from '../services/expenseService'
import { createSubscription } from '../services/subscriptionService'

const subscriptionCurrencies = ['USD', 'EUR', 'CNY', 'AUD']
const subscriptionFrequencies = ['daily', 'weekly', 'monthly', 'yearly']
const subscriptionCategories = [
  'sports',
  'technology',
  'other',
  'entertainment',
  'lifestyle',
  'finance',
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
  category: '',
  date: '',
  notes: '',
}

function CreateEntries() {
  const [subscriptionForm, setSubscriptionForm] = useState(initialSubscription)
  const [expenseForm, setExpenseForm] = useState(initialExpense)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscriptionChange = (field, value) => {
    setSubscriptionForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleExpenseChange = (field, value) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateSubscription = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await createSubscription({
        ...subscriptionForm,
        price: Number(subscriptionForm.price),
      })
      setMessage('Subscription created successfully')
      setSubscriptionForm(initialSubscription)
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to create subscription'
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpense = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await createExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      })
      setMessage('Expense created successfully')
      setExpenseForm(initialExpense)
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? 'Failed to create expense'
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-600">New entries</p>
        <h1 className="text-3xl font-bold text-slate-900">Create subscriptions and expenses</h1>
        <p className="text-sm text-slate-600">
          Fill in the details and submit; successful records attach to the current signed-in user.
        </p>
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={handleCreateSubscription}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create subscription</h2>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Submit
            </button>
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
              {subscriptionCurrencies.map((option) => (
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
        </form>

        <form
          onSubmit={handleCreateExpense}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Create expense</h2>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Submit
            </button>
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
        </form>
      </div>
    </div>
  )
}

export default CreateEntries

