import api from './api'
import { simpleCache } from '../utils/simpleCache'

export async function createExpense(payload) {
  const response = await api.post('/expenses', payload)
  simpleCache.invalidateByPrefix('expense-')
  simpleCache.invalidateByPrefix('budget-') // Expenses affect budget summaries
  return response.data ?? {}
}

export async function listExpenses(params, { signal } = {}) {
  const { month, year, userId } = params
  const cacheKey = `expense-list-${userId || 'anon'}-${month}-${year}`
  return simpleCache.getOrSet(cacheKey, async () => {
    const response = await api.get('/expenses', {
      params,
      signal,
    })
    return response.data ?? []
  }, signal)
}

export async function getExpenseById(id) {
  const response = await api.get(`/expenses/${id}`)
  return response.data ?? {}
}

export async function updateExpense(id, payload) {
  const response = await api.put(`/expenses/${id}`, payload)
  simpleCache.invalidateByPrefix('expense-')
  simpleCache.invalidateByPrefix('budget-') // Expenses affect budget summaries
  return response.data ?? {}
}

export async function deleteExpense(id) {
  const response = await api.delete(`/expenses/${id}`)
  simpleCache.invalidateByPrefix('expense-')
  simpleCache.invalidateByPrefix('budget-') // Expenses affect budget summaries
  return response.data ?? {}
}
