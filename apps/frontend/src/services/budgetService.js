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
  simpleCache.clear() // Invalidate cache
  return response.data?.data ?? {}
}

export async function updateBudget(id, payload) {
  const response = await api.put(`/budgets/${id}`, payload)
  simpleCache.clear() // Invalidate cache
  return response.data?.data ?? {}
}

export async function deleteBudget(id) {
  const response = await api.delete(`/budgets/${id}`)
  simpleCache.clear() // Invalidate cache
  return response.data ?? {}
}

export async function getBudgetSummary({ month, year, signal }) {
  const cacheKey = `budget-summary-${month}-${year}`
  const cached = simpleCache.get(cacheKey)
  if (cached) return cached

  const response = await api.get('/budgets/summary/spending-summary', {
    params: { month, year },
    signal,
  })
  const data = response.data?.data ?? null
  simpleCache.set(cacheKey, data)
  return data
}


