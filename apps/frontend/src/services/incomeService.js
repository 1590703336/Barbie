import api from './api'
import { simpleCache } from '../utils/simpleCache'

export async function createIncome(payload) {
    const response = await api.post('/income', payload)
    simpleCache.invalidateByPrefix('income-')
    return response.data ?? {}
}

export async function listIncomes({ month, year, userId }, { signal } = {}) {
    const cacheKey = `income-list-${userId || 'anon'}-${month}-${year}`
    return simpleCache.getOrSet(cacheKey, async () => {
        const response = await api.get('/income', {
            params: { month, year, userId },
            signal,
        })
        return response.data?.data ?? []
    }, signal)
}

export async function getIncomeById(id) {
    const response = await api.get(`/income/${id}`)
    return response.data?.data ?? {}
}

export async function updateIncome(id, payload) {
    const response = await api.put(`/income/${id}`, payload)
    simpleCache.invalidateByPrefix('income-')
    return response.data?.data ?? {}
}

export async function deleteIncome(id) {
    const response = await api.delete(`/income/${id}`)
    simpleCache.invalidateByPrefix('income-')
    return response.data ?? {}
}

export async function getIncomeSummary({ month, year }, { signal } = {}) {
    const cacheKey = `income-summary-${month}-${year}`
    return simpleCache.getOrSet(cacheKey, async () => {
        const response = await api.get('/income/summary', {
            params: { month, year },
            signal,
        })
        return response.data?.data ?? null
    }, signal)
}
