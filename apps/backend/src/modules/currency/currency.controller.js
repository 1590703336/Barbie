import { getExchangeRates } from './currency.service.js';

export const getRates = async (req, res, next) => {
    try {
        const rates = await getExchangeRates();
        res.status(200).json({
            success: true,
            data: rates
        });
    } catch (error) {
        next(error);
    }
};
