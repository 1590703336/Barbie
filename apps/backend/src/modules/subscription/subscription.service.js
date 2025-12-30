import Subscription from './subscription.model.js';

export const createSubscription = async (subscriptionData) => {
    return await Subscription.create(subscriptionData);
};

export const getSubscriptions = async (userId, requester) => {
    if (requester.role !== 'admin' && requester.id !== userId) {
        const error = new Error('You are not authorized to access this resource');
        error.statusCode = 403;
        throw error;
    }
    return await Subscription.find({ user: userId });
};

export const getSubscriptionById = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if (requester.role !== 'admin' && subscription.user.toString() !== requester.id) {
        const error = new Error('You are not authorized to access this subscription');
        error.statusCode = 403;
        throw error;
    }
    return subscription;
};

export const getAllSubscriptions = async (requester) => {
    if (requester.role === 'admin') {
        return await Subscription.find();
    }
    return await Subscription.find({ user: requester.id });
};

export const updateSubscription = async (subscriptionId, updateData, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if(subscription.user.toString() !== requester.id && requester.role !== 'admin') {
        const error = new Error('You are not authorized to update this subscription');
        error.statusCode = 403;
        throw error;
    }

    Object.assign(subscription, updateData);
    await subscription.save();
    return subscription;
};

export const deleteSubscription = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if(subscription.user.toString() !== requester.id && requester.role !== 'admin') {
        const error = new Error('You are not authorized to delete this subscription');
        error.statusCode = 403;
        throw error;
    }

    await subscription.deleteOne();
    return { deleted: true };
};

export const cancelSubscription = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if(subscription.user.toString() !== requester.id && requester.role !== 'admin') {
        const error = new Error('You are not authorized to cancel this subscription');
        error.statusCode = 403;
        throw error;
    }

    subscription.status = 'cancelled';
    await subscription.save();
    return subscription;
};

export const getUpcomingRenewals = async (userId, requester, daysAhead = 30) => { // get upcoming renewals for the next 30 days
    if (requester.role !== 'admin' && requester.id !== userId) {
        const error = new Error('You are not authorized to access this resource');
        error.statusCode = 403;
        throw error;
    }

    const targetUserId = requester.role === 'admin' && userId ? userId : requester.id;
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + daysAhead);

    return await Subscription.find({
        user: targetUserId,
        renewalDate: { $gte: now, $lte: cutoff },
        status: { $ne: 'cancelled' },
    }).sort({ renewalDate: 1 });
};
