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
    getUpcomingRenewals,
    getTotalSubscription
} from './subscription.controller.js';

const subscriptionRouter = Router();
subscriptionRouter.use(authorize); // protecting all subscription routes with authorization middleware

subscriptionRouter.get('/', getAllSubscriptions);

subscriptionRouter.get('/upcoming-renewals', getUpcomingRenewals);

subscriptionRouter.get('/total', getTotalSubscription);

subscriptionRouter.get('/:id', getSubscriptionById);

subscriptionRouter.post('/', validate(subscriptionSchema), createSubscription);

subscriptionRouter.put('/:id', updateSubscription);

subscriptionRouter.delete('/:id', deleteSubscription);

subscriptionRouter.get('/user/:id', getSubscriptions);

subscriptionRouter.put('/:id/cancel', cancelSubscription);


export default subscriptionRouter;
