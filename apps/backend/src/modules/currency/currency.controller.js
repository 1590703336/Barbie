import { getExchangeRatesWithMeta, getHistoricalRates } from './currency.service.js';

export const getRates = async (req, res, next) => {
    try {
        const { rates, cacheTime, cacheDuration, nextUpdateTime } = await getExchangeRatesWithMeta();
        res.status(200).json({
            success: true,
            data: rates,
            cacheTime,
            cacheDuration,
            nextUpdateTime
        });
    } catch (error) {
        next(error);
    }
};

export const getHistoricalRatesHandler = async (req, res, next) => {
    try {
        const { from, to, start, end } = req.query;

        if (!from || !to || !start || !end) {
            return res.status(400).json({
                success: false,
                message: 'Missing required query parameters: from, to, start, end'
            });
        }

        const data = await getHistoricalRates(from, to, start, end);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};
