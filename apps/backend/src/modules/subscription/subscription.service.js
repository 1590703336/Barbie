import { convertToUSD } from '../currency/currency.service.js';
import mongoose from 'mongoose'; // Only for Types.ObjectId if needed for pipeline construction

/**
 * Prepares subscription data for creation/update.
 * Handles currency conversion and renewal date calculation.
 */
export const prepareSubscriptionData = async (data, existingData = {}) => {
    const processedData = { ...data };

    // 1. Handle Currency Conversion
    if (processedData.price || processedData.currency) {
        const price = processedData.price !== undefined ? processedData.price : existingData.price;
        const currency = processedData.currency || existingData.currency;

        if (price !== undefined && currency) {
            processedData.amountUSD = await convertToUSD(price, currency);
        }
    }

    // 2. Handle Renewal Date Calculation logic (Migration from Model Pre-save)
    // If startDate or frequency changes, or if it's new and no renewalDate provided
    const startDate = processedData.startDate ? new Date(processedData.startDate) : (existingData.startDate ? new Date(existingData.startDate) : null);
    const frequency = processedData.frequency || existingData.frequency;

    if (startDate && frequency && (!processedData.renewalDate && !existingData.renewalDate)) {
        const renewalPeriods = {
            daily: 1,
            weekly: 7,
            monthly: 30,
            yearly: 365,
        };
        const period = renewalPeriods[frequency] || 0;
        const renewalDate = new Date(startDate);
        renewalDate.setDate(renewalDate.getDate() + period);
        processedData.renewalDate = renewalDate;
    }

    // 3. Handle Status Update (Expired)
    const effectiveRenewalDate = processedData.renewalDate ? new Date(processedData.renewalDate) : (existingData.renewalDate ? new Date(existingData.renewalDate) : null);
    if (effectiveRenewalDate && effectiveRenewalDate < new Date()) {
        processedData.status = 'expired';
    }

    return processedData;
};

// Builder for Total Subscription Aggregation
export const buildTotalSubscriptionPipeline = (userId) => {
    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                status: 'active',
            },
        },
        {
            $group: {
                _id: '$frequency',
                total: { $sum: { $ifNull: ['$amountUSD', '$price'] } },
            },
        },
    ];
};

// Logic to calculate total annual cost from frequency stats
export const calculateTotalFromStats = (stats) => {
    const frequencyMultipliers = {
        daily: 365,
        weekly: 52,
        monthly: 12,
        yearly: 1,
    };

    return stats.reduce(
        (sum, item) => sum + (frequencyMultipliers[item._id] || 0) * item.total,
        0,
    );
};

/*
    NOTE:
    Previous data access methods have been moved to subscription.repository.js:
    - createSubscription -> subscriptionRepository.create
    - getSubscriptions -> subscriptionRepository.find
    - getSubscriptionById -> subscriptionRepository.findById
    - updateSubscription -> subscriptionRepository.update
    - deleteSubscription -> subscriptionRepository.deleteById
    - cancelSubscription -> subscriptionRepository.update
*/
