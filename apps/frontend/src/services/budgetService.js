import api from './api'

export async function listBudgets({ month, year, userId }) {
  const response = await api.get('/budgets', {
    params: { month, year, ...(userId ? { userId } : {}) },
  })
  return response.data?.data ?? []
}

export async function createBudget(payload) {
  const response = await api.post('/budgets', payload)
  return response.data?.data ?? {}
}

export async function updateBudget(id, payload) {
  const response = await api.put(`/budgets/${id}`, payload)
  // Return the full response data to include alerts field
  return response.data ?? {}
}

export async function deleteBudget(id) {
  const response = await api.delete(`/budgets/${id}`)
  return response.data ?? {}
}

export async function getBudgetSummary({ month, year, userId }) {
  const response = await api.get('/budgets/summary/spending-summary', {
    params: { month, year },
  })
  return response.data?.data ?? null
}

export async function getImportPreview({ month, year }) {
  const response = await api.get('/budgets/import/preview', {
    params: { month, year },
  })
  return response.data?.data ?? null
}

export async function importBudgets({ targetMonth, targetYear, budgets, strategy }) {
  const response = await api.post('/budgets/import', {
    targetMonth,
    targetYear,
    budgets,
    strategy,
  })
  return response.data?.data ?? []
}

