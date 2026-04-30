import { Router } from 'express';
import authorize from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { bindBotSchema } from './telegramBot.validation.js';
import { getMyBinding, bindBot, unbindBot } from './telegramBot.controller.js';

const telegramBotRouter = Router();

telegramBotRouter.use(authorize);

telegramBotRouter.get('/me', getMyBinding);
telegramBotRouter.post('/', validate(bindBotSchema), bindBot);
telegramBotRouter.delete('/', unbindBot);

export default telegramBotRouter;
