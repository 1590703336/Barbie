import api from './api'

export async function createIncome(payload) {
    const response = await api.post('/income', payload)
    return response.data ?? {}
}

export async function listIncomes(params, { signal } = {}) {
    const response = await api.get('/income', {
        params,
        signal,
    })
    return response.data?.data ?? []
}

export async function getIncomeById(id) {
    const response = await api.get(`/income/${id}`)
    return response.data?.data ?? {}
}

export async function updateIncome(id, payload) {
    const response = await api.put(`/income/${id}`, payload)
    return response.data?.data ?? {}
}

export async function deleteIncome(id) {
    const response = await api.delete(`/income/${id}`)
    return response.data ?? {}
}

export async function getIncomeSummary(params, { signal } = {}) {
    const response = await api.get('/income/summary', {
        params,
        signal,
    })
    return response.data?.data ?? null
}
