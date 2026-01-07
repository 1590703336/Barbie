import mongoose from 'mongoose';
import { convertToUSD } from '../currency/currency.service.js';

// Prepare income data
export const prepareIncomeData = async (incomeData, existingIncome = {}) => {
    const processedData = { ...incomeData };

    if (processedData.date) {
        processedData.date = new Date(processedData.date);
    }

    // Convert to USD if amount or currency is provided, or if it's a new income
    if (processedData.amount || processedData.currency) {
        const amount = processedData.amount !== undefined ? processedData.amount : existingIncome.amount;
        const currency = processedData.currency || existingIncome.currency || 'USD';

        if (amount !== undefined) {
            processedData.amountUSD = await convertToUSD(amount, currency);
        }
    }

    return processedData;
};

// Build aggregation pipeline for monthly income stats
export const buildMonthlyStatsPipeline = (userId, month, year) => {
    // Start of the month
    const startDate = new Date(year, month - 1, 1);
    // End of the month (start of next month)
    const endDate = new Date(year, month, 1);

    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        },
        {
            $group: {
                _id: "$category",
                totalAmount: { $sum: "$amountUSD" }, // Sum USD amount
                count: { $sum: 1 }
            }
        }
    ];
};
