import * as subscriptionService from './subscription.service.js';

export const createSubscription = async (req, res, next) => {
    try {
        const subscription = await subscriptionService.createSubscription({
            ...req.body,
            user: req.user._id,
        });
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
        const subscription = await subscriptionService.updateSubscription(
            req.params.id,
            req.body,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const result = await subscriptionService.deleteSubscription(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
        res.status(200).json({
            success: true,
            message: 'Subscription deleted successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const cancelSubscription = async (req, res, next) => {
    try {
        const subscription = await subscriptionService.cancelSubscription(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const renewals = await subscriptionService.getUpcomingRenewals(
            targetUserId,
            { id: req.user._id.toString(), role: req.user.role }
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

export const getSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await subscriptionService.getSubscriptions(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const subscription = await subscriptionService.getSubscriptionById(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const subscriptions = await subscriptionService.getAllSubscriptions(
            { id: req.user._id.toString(), role: req.user.role }
        );
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
