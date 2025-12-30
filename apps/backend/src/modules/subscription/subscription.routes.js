import { Router } from 'express';
import authorize from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { subscriptionSchema } from './subscription.validation.js';
import {
    createSubscription,
    getSubscriptions,
    getAllSubscriptions,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    getUpcomingRenewals
} from './subscription.controller.js';

const subscriptionRouter = Router();

subscriptionRouter.get('/', authorize, getAllSubscriptions);

subscriptionRouter.get('/upcoming-renewals', authorize, getUpcomingRenewals);

subscriptionRouter.get('/:id', authorize, getSubscriptionById);

subscriptionRouter.post('/', authorize, validate(subscriptionSchema), createSubscription);

subscriptionRouter.put('/:id', authorize, updateSubscription);

subscriptionRouter.delete('/:id', authorize, deleteSubscription);

subscriptionRouter.get('/user/:id', authorize, getSubscriptions);

subscriptionRouter.put('/:id/cancel', authorize, cancelSubscription);


export default subscriptionRouter;
