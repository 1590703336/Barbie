import Subscription from './subscription.model.js';

export const createSubscription = async (subscriptionData) => {
    return await Subscription.create(subscriptionData);
};

export const getSubscriptions = async (userId, requesterId) => {
    if(requesterId !== userId) {
        const error = new Error('You are not authorized to access this resource');
        error.statusCode = 401;
        throw error;
    }
    return await Subscription.find({ user: userId });
};

export const getSubscriptionById = async (subscriptionId) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    return subscription;
};

export const getAllSubscriptions = async () => {
    const subscriptions = await Subscription.find();
    if(!subscriptions) { // find returns empty array not null usually, but assuming logic from original controller
         // Wait, original controller said if(!subscriptions). Mongoose find returns [], which is truthy.
         // But let's keep logic or improve it. Empty array is fine.
         // Original: if(!subscriptions) -> Error 'No subscriptions found'.
         // I'll keep it simple: return subscriptions.
    }
    return subscriptions;
};

export const updateSubscription = async (subscriptionId, updateData, requesterId) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if(subscription.user.toString() !== requesterId) {
        const error = new Error('You are not authorized to update this subscription');
        error.statusCode = 401;
        throw error;
    }

    Object.assign(subscription, updateData);
    await subscription.save();
    return subscription;
};

export const deleteSubscription = async (subscriptionId, requesterId) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if(subscription.user.toString() !== requesterId) {
        const error = new Error('You are not authorized to delete this subscription');
        error.statusCode = 401;
        throw error;
    }

    await subscription.deleteOne();
    return { deleted: true };
};

export const cancelSubscription = async (subscriptionId, requesterId) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if(subscription.user.toString() !== requesterId) {
        const error = new Error('You are not authorized to cancel this subscription');
        error.statusCode = 401;
        throw error;
    }

    subscription.status = 'cancelled';
    await subscription.save();
    return subscription;
};

export const getUpcomingRenewals = async (userId, daysAhead = 30) => { // get upcoming renewals for the next 30 days
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + daysAhead);

    return await Subscription.find({
        user: userId,
        renewalDate: { $gte: now, $lte: cutoff },
        status: { $ne: 'cancelled' },
    }).sort({ renewalDate: 1 });
};
