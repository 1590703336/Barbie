import axios from 'axios';

let ratesCache = null;
let cacheTime = 0;
const CACHE_DURATION = 3600 * 1000; // 1 hour

// Historical rates cache (keyed by from-to-start-end)
const historicalCache = new Map();
const HISTORICAL_CACHE_DURATION = 24 * 3600 * 1000; // 24 hours (historical data doesn't change)

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

// Get exchange rates with cache metadata
export const getExchangeRatesWithMeta = async () => {
    const rates = await getExchangeRates();
    return {
        rates,
        cacheTime: cacheTime,
        cacheDuration: CACHE_DURATION,
        nextUpdateTime: cacheTime + CACHE_DURATION
    };
};

/**
 * Get historical exchange rates from Frankfurter API
 * @param {string} fromCurrency - Base currency (e.g., 'USD')
 * @param {string} toCurrency - Target currency (e.g., 'EUR')
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} Historical rates data
 */
export const getHistoricalRates = async (fromCurrency, toCurrency, startDate, endDate) => {
    const cacheKey = `${fromCurrency}-${toCurrency}-${startDate}-${endDate}`;
    const now = Date.now();

    // Check cache
    const cached = historicalCache.get(cacheKey);
    if (cached && (now - cached.timestamp < HISTORICAL_CACHE_DURATION)) {
        return cached.data;
    }

    try {
        const url = `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=${fromCurrency}&symbols=${toCurrency}`;
        const response = await axios.get(url);

        // Transform data for easier frontend consumption
        const rates = response.data.rates;
        const series = Object.entries(rates).map(([date, rateObj]) => ({
            date,
            rate: rateObj[toCurrency]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const result = {
            base: response.data.base,
            target: toCurrency,
            startDate: response.data.start_date,
            endDate: response.data.end_date,
            series
        };

        // Cache the result
        historicalCache.set(cacheKey, { data: result, timestamp: now });

        return result;
    } catch (error) {
        console.error('Error fetching historical rates:', error);
        throw new Error('Failed to fetch historical exchange rates');
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

