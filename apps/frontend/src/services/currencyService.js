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

/**
 * Get historical exchange rates for a currency pair
 * @param {Object} params
 * @param {string} params.fromCurrency - Base currency (e.g., 'USD')
 * @param {string} params.toCurrency - Target currency (e.g., 'EUR')
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.granularity - 'weekly' | 'monthly' | 'yearly'
 */
export async function getHistoricalRates({ fromCurrency, toCurrency, startDate, endDate, granularity }) {
    const response = await api.get('/currencies/history', {
        params: { from: fromCurrency, to: toCurrency, start: startDate, end: endDate, granularity }
    })
    return response.data
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

