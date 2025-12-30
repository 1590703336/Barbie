import api from './api'

export async function createExpense(payload) {
  const response = await api.post('/expenses', payload)
  return response.data ?? {}
}

export async function listExpenses() {
  const response = await api.get('/expenses')
  return response.data ?? []
}

export async function getExpenseById(id) {
  const response = await api.get(`/expenses/${id}`)
  return response.data ?? {}
}

export async function updateExpense(id, payload) {
  const response = await api.put(`/expenses/${id}`, payload)
  return response.data ?? {}
}

export async function deleteExpense(id) {
  const response = await api.delete(`/expenses/${id}`)
  return response.data ?? {}
}

