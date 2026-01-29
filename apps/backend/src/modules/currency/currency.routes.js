import { Router } from 'express';
import { getRates, getHistoricalRatesHandler } from './currency.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const currencyRouter = Router();

currencyRouter.get('/', getRates);
currencyRouter.get('/history', getHistoricalRatesHandler);

export default currencyRouter;
