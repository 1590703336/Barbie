import api from './api'
import { simpleCache } from '../utils/simpleCache'

export async function listBudgets({ month, year, userId, signal }) {
  const response = await api.get('/budgets', {
    params: { month, year, ...(userId ? { userId } : {}) },
    signal,
  })
  return response.data?.data ?? []
}

export async function createBudget(payload) {
  const response = await api.post('/budgets', payload)
  simpleCache.invalidateByPrefix('budget-')
  return response.data?.data ?? {}
}

export async function updateBudget(id, payload) {
  const response = await api.put(`/budgets/${id}`, payload)
  simpleCache.invalidateByPrefix('budget-')
  return response.data?.data ?? {}
}

export async function deleteBudget(id) {
  const response = await api.delete(`/budgets/${id}`)
  simpleCache.invalidateByPrefix('budget-')
  return response.data ?? {}
}

export async function getBudgetSummary({ month, year, userId, signal }) {
  const cacheKey = `budget-summary-${userId || 'anon'}-${month}-${year}`
  return simpleCache.getOrSet(cacheKey, async () => {
    const response = await api.get('/budgets/summary/spending-summary', {
      params: { month, year },
      signal,
    })
    return response.data?.data ?? null
  }, signal)
}
