import api from './api'

export async function getSubscriptions() {
  const response = await api.get('/subscriptions')
  return response.data?.data?.subscriptions ?? []
}

export async function getSubscriptionById(id) {
  const response = await api.get(`/subscriptions/${id}`)
  return response.data?.data?.subscription ?? null
}

export async function getUserSubscriptions(userId) {
  const response = await api.get(`/subscriptions/user/${userId}`)
  return response.data?.data?.subscriptions ?? []
}

export async function createSubscription(payload) {
  const response = await api.post('/subscriptions', payload)
  return response.data?.data?.subscription ?? {}
}

export async function updateSubscription(id, payload) {
  const response = await api.put(`/subscriptions/${id}`, payload)
  return response.data?.data ?? {}
}

export async function cancelSubscription(id) {
  const response = await api.put(`/subscriptions/${id}/cancel`)
  return response.data?.data ?? {}
}

export async function deleteSubscription(id) {
  const response = await api.delete(`/subscriptions/${id}`)
  return response.data ?? {}
}

export async function getUpcomingRenewals(days = 7) {
  const response = await api.get('/subscriptions/upcoming-renewals', {
    params: { days },
  })
  return response.data?.data?.renewals ?? []
}

