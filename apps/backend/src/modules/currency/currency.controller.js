import { getExchangeRatesWithMeta } from './currency.service.js';

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
