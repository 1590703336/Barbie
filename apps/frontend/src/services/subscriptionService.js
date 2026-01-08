import api from './api'
import { simpleCache } from '../utils/simpleCache'

export async function getSubscriptions({ signal } = {}) {
  const response = await api.get('/subscriptions', { signal })
  return response.data?.data?.subscriptions ?? []
}

export async function getSubscriptionById(id) {
  const response = await api.get(`/subscriptions/${id}`)
  return response.data?.data?.subscription ?? null
}

export async function getUserSubscriptions(userId, { signal } = {}) {
  const response = await api.get(`/subscriptions/user/${userId}`, { signal })
  return response.data?.data?.subscriptions ?? []
}

export async function createSubscription(payload) {
  const response = await api.post('/subscriptions', payload)
  simpleCache.clear() // Invalidate on change
  return response.data?.data?.subscription ?? {}
}

export async function updateSubscription(id, payload) {
  const response = await api.put(`/subscriptions/${id}`, payload)
  simpleCache.clear() // Invalidate on change
  return response.data?.data ?? {}
}

export async function cancelSubscription(id) {
  const response = await api.put(`/subscriptions/${id}/cancel`)
  simpleCache.clear() // Invalidate on change
  return response.data?.data ?? {}
}

export async function deleteSubscription(id) {
  const response = await api.delete(`/subscriptions/${id}`)
  simpleCache.clear() // Invalidate on change
  return response.data ?? {}
}

export async function getUpcomingRenewals(days = 7, { signal } = {}) {
  const response = await api.get('/subscriptions/upcoming-renewals', {
    params: { days },
    signal,
  })
  return response.data?.data?.renewals ?? []
}

export async function getTotalSubscription({ userId, signal } = {}) {
  const cacheKey = `total-subscription-${userId || 'anon'}`
  return simpleCache.getOrSet(cacheKey, async () => {
    const response = await api.get('/subscriptions/total', {
      params: userId ? { userId } : {},
      signal,
    })
    return response.data?.data?.total ?? 0
  })
}

