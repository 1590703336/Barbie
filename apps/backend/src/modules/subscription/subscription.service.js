import mongoose from 'mongoose';
import Subscription from './subscription.model.js';
import { assertAdmin, assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from '../../utils/authorization.js';
import { convertToUSD } from '../currency/currency.service.js';

export const createSubscription = async (subscriptionData) => {
    if (subscriptionData.price && subscriptionData.currency) {
        subscriptionData.amountUSD = await convertToUSD(subscriptionData.price, subscriptionData.currency);
    }
    return await Subscription.create(subscriptionData);
};

export const getSubscriptions = async (userId, requester) => {
    assertSameUserOrAdmin(userId, requester, 'access these subscriptions');
    return await Subscription.find({ user: userId });
};

export const getSubscriptionById = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
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
    if (!subscription) {
        throw buildError('Subscription not found', 404);
    }
    assertOwnerOrAdmin(subscription.user, requester, 'update this subscription');

    Object.assign(subscription, updateData);

    // Recalculate if price or currency changed
    if (updateData.price || updateData.currency) {
        const price = updateData.price || subscription.price;
        const currency = updateData.currency || subscription.currency;
        subscription.amountUSD = await convertToUSD(price, currency);
    }

    await subscription.save();
    return subscription;
};

export const deleteSubscription = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
        throw buildError('Subscription not found', 404);
    }
    assertOwnerOrAdmin(subscription.user, requester, 'delete this subscription');

    await subscription.deleteOne();
    return { deleted: true };
};

export const cancelSubscription = async (subscriptionId, requester) => {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
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

export const getTotalSubscription = async (userId, requester) => {
    assertSameUserOrAdmin(userId, requester, 'access total subscription');
    const targetUserId = requester.role === 'admin' && userId ? userId : requester.id;

    const frequencyMultipliers = {
        daily: 365,
        weekly: 52,
        monthly: 12,
        yearly: 1,
    };

    const totalsByFrequency = await Subscription.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(targetUserId),
                status: 'active',
            },
        },
        {
            $group: {
                _id: '$frequency',
                total: { $sum: { $ifNull: ['$amountUSD', '$price'] } },
            },
        },
    ]);

    const total = totalsByFrequency.reduce(
        (sum, item) => sum + (frequencyMultipliers[item._id] || 0) * item.total,
        0,
    );

    return { total };
};
