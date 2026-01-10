import api from './api'

export async function getExchangeRates() {
    const response = await api.get('/currencies')
    return response.data
}

export async function getAvailableCurrencies() {
    const response = await api.get('/currencies')
    const rates = response.data?.data || {}
    return Object.keys(rates).sort()
}

// Convert Pairs API
export async function getConvertPairs() {
    const response = await api.get('/convert-pairs')
    return response.data
}

export async function createConvertPair(data) {
    const response = await api.post('/convert-pairs', data)
    return response.data
}

export async function updateConvertPair(id, data) {
    const response = await api.put(`/convert-pairs/${id}`, data)
    return response.data
}

export async function deleteConvertPair(id) {
    const response = await api.delete(`/convert-pairs/${id}`)
    return response.data
}
