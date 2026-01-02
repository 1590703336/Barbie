import * as subscriptionService from './subscription.service.js';
import * as subscriptionRepository from './subscription.repository.js';
import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from '../../utils/authorization.js';
import { convertFromUSD } from '../currency/currency.service.js';

export const createSubscription = async (req, res, next) => {
    try {
        const subscriptionData = await subscriptionService.prepareSubscriptionData({
            ...req.body,
            user: req.user._id,
        });
        const subscription = await subscriptionRepository.create(subscriptionData);

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                subscription,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateSubscription = async (req, res, next) => {
    try {
        const subscriptionId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingSubscription = await subscriptionRepository.findById(subscriptionId);
        if (!existingSubscription) {
            throw buildError('Subscription not found', 404);
        }
        assertOwnerOrAdmin(existingSubscription.user, requester, 'update this subscription');

        const updateData = await subscriptionService.prepareSubscriptionData(req.body, existingSubscription);
        const subscription = await subscriptionRepository.update(subscriptionId, updateData);

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: { subscription },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSubscription = async (req, res, next) => {
    try {
        const subscriptionId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingSubscription = await subscriptionRepository.findById(subscriptionId);
        if (!existingSubscription) {
            throw buildError('Subscription not found', 404);
        }
        assertOwnerOrAdmin(existingSubscription.user, requester, 'delete this subscription');

        await subscriptionRepository.deleteById(subscriptionId);

        res.status(200).json({
            success: true,
            message: 'Subscription deleted successfully',
            data: { deleted: true },
        });
    } catch (error) {
        next(error);
    }
};

export const cancelSubscription = async (req, res, next) => {
    try {
        const subscriptionId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingSubscription = await subscriptionRepository.findById(subscriptionId);
        if (!existingSubscription) {
            throw buildError('Subscription not found', 404);
        }
        assertOwnerOrAdmin(existingSubscription.user, requester, 'cancel this subscription');

        const subscription = await subscriptionRepository.update(subscriptionId, { status: 'cancelled' });

        res.status(200).json({
            success: true,
            message: 'Subscription canceled successfully',
            data: { subscription },
        });
    } catch (error) {
        next(error);
    }
};

export const getUpcomingRenewals = async (req, res, next) => {
    try {
        const targetUserId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id.toString();
        const requester = { id: req.user._id.toString(), role: req.user.role };

        assertSameUserOrAdmin(targetUserId, requester, 'access these renewals');

        // Logic for date range (moved from service to keep service pure if strictly needed, or implied logic)
        const daysAhead = 30;
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() + daysAhead);

        const renewals = await subscriptionRepository.find(
            {
                user: targetUserId,
                renewalDate: { $gte: now, $lte: cutoff },
                status: { $ne: 'cancelled' },
            },
            { renewalDate: 1 } // Sort
        );

        res.status(200).json({
            success: true,
            message: 'Upcoming renewals fetched successfully',
            data: { renewals },
        });
    } catch (error) {
        next(error);
    }
};


export const getTotalSubscription = async (req, res, next) => {
    try {
        const targetUserId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id.toString();
        const requester = { id: req.user._id.toString(), role: req.user.role };

        assertSameUserOrAdmin(targetUserId, requester, 'access total subscription');

        const pipeline = subscriptionService.buildTotalSubscriptionPipeline(targetUserId);
        const stats = await subscriptionRepository.aggregate(pipeline);
        const totalUSD = subscriptionService.calculateTotalFromStats(stats);

        const userCurrency = req.user.defaultCurrency || 'USD';
        const convertedTotal = await convertFromUSD(totalUSD, userCurrency);

        res.status(200).json({
            success: true,
            message: 'Total subscription fetched successfully',
            data: { total: convertedTotal },
        });
    } catch (error) {
        next(error);
    }
};

export const getSubscriptions = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access these subscriptions');

        const subscriptions = await subscriptionRepository.find({ user: targetUserId });

        res.status(200).json({
            success: true,
            message: 'Subscriptions fetched successfully',
            data: {
                subscriptions,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSubscriptionById = async (req, res, next) => {
    try {
        const subscriptionId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const subscription = await subscriptionRepository.findById(subscriptionId);
        if (!subscription) {
            throw buildError('Subscription not found', 404);
        }
        assertOwnerOrAdmin(subscription.user, requester, 'access this subscription');

        res.status(200).json({
            success: true,
            message: 'Subscription fetched successfully',
            data: {
                subscription,
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllSubscriptions = async (req, res, next) => {
    try {
        const requester = { id: req.user._id.toString(), role: req.user.role };

        let subscriptions;
        if (requester.role === 'admin') {
            subscriptions = await subscriptionRepository.find({});
        } else {
            subscriptions = await subscriptionRepository.find({ user: requester.id });
        }

        res.status(200).json({
            success: true,
            message: 'Subscriptions fetched successfully',
            data: {
                subscriptions,
            }
        });
    } catch (error) {
        next(error);
    }
};
