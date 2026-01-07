import api from './api';

export async function getExchangeRates() {
    const response = await api.get('/currencies');
    return response.data;
}

export async function getAvailableCurrencies() {
    const response = await api.get('/currencies');
    // response.data.data contains the rates object with currency codes as keys
    const rates = response.data?.data || {};
    return Object.keys(rates).sort();
}
