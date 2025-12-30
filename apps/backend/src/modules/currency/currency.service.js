import axios from 'axios';

let ratesCache = null;
let cacheTime = 0;
const CACHE_DURATION = 3600 * 1000; // 1 hour

export const getExchangeRates = async () => {
    const now = Date.now();
    if (ratesCache && (now - cacheTime < CACHE_DURATION)) {
        return ratesCache;
    }

    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        ratesCache = response.data.rates;
        cacheTime = now;
        return ratesCache;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Fallback to cache if available, even if expired, otherwise throw
        if (ratesCache) return ratesCache;
        throw new Error('Failed to fetch exchange rates');
    }
};

export const convertToUSD = async (amount, currencyCode) => {
    if (currencyCode === 'USD') return amount;

    const rates = await getExchangeRates();
    const rate = rates[currencyCode];

    if (!rate) {
        throw new Error(`Currency code ${currencyCode} not found`);
    }

    // Convert to USD: Amount / Rate
    // Example: 100 EUR / 0.92 = 108.69 USD
    return Number((amount / rate).toFixed(2));
};

export const convertFromUSD = async (amountUSD, targetCurrency) => {
    if (targetCurrency === 'USD') return amountUSD;

    const rates = await getExchangeRates();
    const rate = rates[targetCurrency];

    if (!rate) {
        throw new Error(`Currency code ${targetCurrency} not found`);
    }

    // Convert from USD: Amount * Rate
    // Example: 100 USD * 0.92 = 92.00 EUR
    return Number((amountUSD * rate).toFixed(2));
};
