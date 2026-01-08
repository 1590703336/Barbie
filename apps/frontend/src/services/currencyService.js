import api from './api';

export async function getExchangeRates(signal) {
    const response = await api.get('/currencies', { signal });
    return response.data;
}

export async function getAvailableCurrencies(signal) {
    const response = await api.get('/currencies', { signal });
    // response.data.data contains the rates object with currency codes as keys
    const rates = response.data?.data || {};
    return Object.keys(rates).sort();
}

// Convert Pairs API
export async function getConvertPairs() {
    const response = await api.get('/convert-pairs');
    return response.data;
}

export async function createConvertPair(data) {
    const response = await api.post('/convert-pairs', data);
    return response.data;
}

export async function updateConvertPair(id, data) {
    const response = await api.put(`/convert-pairs/${id}`, data);
    return response.data;
}

export async function deleteConvertPair(id) {
    const response = await api.delete(`/convert-pairs/${id}`);
    return response.data;
}
