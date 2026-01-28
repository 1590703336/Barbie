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
 * @param {string} granularity - 'weekly' | 'monthly' | 'yearly' - determines aggregation level
 * @returns {Object} Historical rates data (aggregated)
 */
export const getHistoricalRates = async (fromCurrency, toCurrency, startDate, endDate, granularity = 'monthly') => {
    const cacheKey = `${fromCurrency}-${toCurrency}-${startDate}-${endDate}-${granularity}`;
    const now = Date.now();

    // Check cache
    const cached = historicalCache.get(cacheKey);
    if (cached && (now - cached.timestamp < HISTORICAL_CACHE_DURATION)) {
        return cached.data;
    }

    try {
        const url = `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=${fromCurrency}&symbols=${toCurrency}`;
        const response = await axios.get(url, { timeout: 15000 }); // 15s timeout

        // Transform data for easier frontend consumption
        const rates = response.data.rates;
        let series = Object.entries(rates).map(([date, rateObj]) => ({
            date,
            rate: rateObj[toCurrency]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Aggregate data based on granularity to improve performance
        // Weekly: keep daily data (max ~84 points)
        // Monthly: aggregate to weekly averages (max ~52 points)
        // Yearly: aggregate to monthly averages (max ~60 points)
        if (granularity === 'monthly' && series.length > 100) {
            series = aggregateToWeekly(series);
        } else if (granularity === 'yearly') {
            series = aggregateToMonthly(series);
        }

        const result = {
            base: response.data.base,
            target: toCurrency,
            startDate: response.data.start_date,
            endDate: response.data.end_date,
            granularity,
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

/**
 * Aggregate daily rates to weekly averages
 */
function aggregateToWeekly(series) {
    const weeks = {};
    series.forEach(item => {
        const date = new Date(item.date);
        // Get ISO week start (Monday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeks[weekKey]) {
            weeks[weekKey] = { sum: 0, count: 0 };
        }
        weeks[weekKey].sum += item.rate;
        weeks[weekKey].count += 1;
    });

    return Object.entries(weeks)
        .map(([date, { sum, count }]) => ({
            date,
            rate: sum / count
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Aggregate daily rates to monthly averages
 */
function aggregateToMonthly(series) {
    const months = {};
    series.forEach(item => {
        const monthKey = item.date.substring(0, 7); // YYYY-MM

        if (!months[monthKey]) {
            months[monthKey] = { sum: 0, count: 0 };
        }
        months[monthKey].sum += item.rate;
        months[monthKey].count += 1;
    });

    return Object.entries(months)
        .map(([monthKey, { sum, count }]) => ({
            date: `${monthKey}-15`, // Mid-month for display
            rate: sum / count
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}


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

