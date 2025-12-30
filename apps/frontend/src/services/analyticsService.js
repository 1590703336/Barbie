import api from './api'

export async function fetchSummary() {
  const response = await api.get('/analytics/summary')
  return response.data ?? {}
}

export async function fetchFunnels() {
  const response = await api.get('/analytics/funnels')
  return response.data ?? []
}

export async function fetchTrends() {
  const response = await api.get('/analytics/trends')
  return response.data ?? []
}

