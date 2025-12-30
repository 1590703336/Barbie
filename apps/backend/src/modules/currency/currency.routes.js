import { Router } from 'express';
import { getRates } from './currency.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const currencyRouter = Router();

currencyRouter.get('/', getRates);

export default currencyRouter;
