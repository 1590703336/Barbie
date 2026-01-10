import api from './api';
import { simpleCache } from '../utils/simpleCache';

// Exchange rates TTL: 5 minutes (rates don't change based on user actions)
const RATES_TTL = 5 * 60 * 1000;
// Convert pairs TTL: 60 seconds
const PAIRS_TTL = 60 * 1000;

export async function getExchangeRates({ signal } = {}) {
    const cacheKey = 'currency-rates';
    return simpleCache.getOrSet(cacheKey, async () => {
        const response = await api.get('/currencies', { signal });
        return response.data;
    }, signal, RATES_TTL);
}

export async function getAvailableCurrencies({ signal } = {}) {
    // Reuse the same cache as getExchangeRates since it's the same API call
    const cacheKey = 'currency-rates';
    const ratesData = await simpleCache.getOrSet(cacheKey, async () => {
        const response = await api.get('/currencies', { signal });
        return response.data;
    }, signal, RATES_TTL);

    // Extract currency codes from the rates object
    const rates = ratesData?.data || {};
    return Object.keys(rates).sort();
}

// Convert Pairs API
export async function getConvertPairs({ signal } = {}) {
    const cacheKey = 'currency-convert-pairs';
    return simpleCache.getOrSet(cacheKey, async () => {
        const response = await api.get('/convert-pairs', { signal });
        return response.data;
    }, signal, PAIRS_TTL);
}

export async function createConvertPair(data) {
    const response = await api.post('/convert-pairs', data);
    // Only invalidate convert-pairs cache, NOT the exchange rates
    simpleCache.delete('currency-convert-pairs');
    return response.data;
}

export async function updateConvertPair(id, data) {
    const response = await api.put(`/convert-pairs/${id}`, data);
    // Only invalidate convert-pairs cache, NOT the exchange rates
    simpleCache.delete('currency-convert-pairs');
    return response.data;
}

export async function deleteConvertPair(id) {
    const response = await api.delete(`/convert-pairs/${id}`);
    // Only invalidate convert-pairs cache, NOT the exchange rates
    simpleCache.delete('currency-convert-pairs');
    return response.data;
}
