import Subscription from './subscription.model.js';
import { assertAdmin, assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from '../../utils/authorization.js';

export const createSubscription = async (subscriptionData) => {
    return await Subscription.create(subscriptionData);
};

export const getSubscriptions = async (userId, requester) => {
    assertSameUserOrAdmin(userId, requester, 'access these subscriptions');
    return await Subscription.find({ user: userId });
};

export const getSubscriptionById = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        throw buildError('Subscription not found', 404);
    }
    assertOwnerOrAdmin(subscription.user, requester, 'access this subscription');
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
        throw buildError('Subscription not found', 404);
    }
    assertOwnerOrAdmin(subscription.user, requester, 'update this subscription');

    Object.assign(subscription, updateData);
    await subscription.save();
    return subscription;
};

export const deleteSubscription = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        throw buildError('Subscription not found', 404);
    }
    assertOwnerOrAdmin(subscription.user, requester, 'delete this subscription');

    await subscription.deleteOne();
    return { deleted: true };
};

export const cancelSubscription = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if(!subscription) {
        throw buildError('Subscription not found', 404);
    }
    assertOwnerOrAdmin(subscription.user, requester, 'cancel this subscription');

    subscription.status = 'cancelled';
    await subscription.save();
    return subscription;
};

export const getUpcomingRenewals = async (userId, requester, daysAhead = 30) => { // get upcoming renewals for the next 30 days
    assertSameUserOrAdmin(userId, requester, 'access these renewals');

    const targetUserId = requester.role === 'admin' && userId ? userId : requester.id; // if the requester is an admin, use the target user id, otherwise use the requester id
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + daysAhead);

    return await Subscription.find({
        user: targetUserId,
        renewalDate: { $gte: now, $lte: cutoff },
        status: { $ne: 'cancelled' },
    }).sort({ renewalDate: 1 });
};
