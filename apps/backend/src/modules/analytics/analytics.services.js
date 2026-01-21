/**
 * Analytics Services
 * 
 * Business logic and aggregation pipelines for analytics endpoints.
 * Uses Date.UTC() for all date calculations to avoid timezone bugs.
 */

import mongoose from 'mongoose';

/**
 * Build date range for a given granularity and count
 * @param {string} granularity - 'weekly' | 'monthly' | 'yearly'
 * @param {number} count - Number of periods
 * @returns {Object} { startDate, endDate }
 */
export const buildDateRange = (granularity, count) => {
    const now = new Date();
    let startDate, endDate;

    if (granularity === 'weekly') {
        // End date is end of current week (Sunday)
        endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
        // Start date is count weeks ago
        const startDay = now.getDate() - (count * 7) + 1;
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), startDay, 0, 0, 0, 0));
    } else if (granularity === 'yearly') {
        // End is current year end
        endDate = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59, 999));
        // Start is count years ago
        startDate = new Date(Date.UTC(now.getFullYear() - count + 1, 0, 1, 0, 0, 0, 0));
    } else {
        // monthly (default)
        // End is end of current month
        endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
        // Start is count months ago
        startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - count + 1, 1, 0, 0, 0, 0));
    }

    return { startDate, endDate };
};

/**
 * Build date range for a specific month/year
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Object} { startDate, endDate }
 */
export const buildMonthDateRange = (month, year) => {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { startDate, endDate };
};

/**
 * Build aggregation pipeline for trend data
 * Groups income/expense by period (week, month, or year)
 * 
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date  
 * @param {string} granularity - 'weekly' | 'monthly' | 'yearly'
 * @returns {Array} Aggregation pipeline for expenses
 */
export const buildTrendExpensePipeline = (userId, startDate, endDate, granularity) => {
    // Date grouping expression based on granularity
    let dateGroup;
    if (granularity === 'weekly') {
        dateGroup = {
            $dateToString: {
                format: '%G-W%V', // ISO week format: 2026-W03
                date: '$date'
            }
        };
    } else if (granularity === 'yearly') {
        dateGroup = { $year: '$date' };
    } else {
        // monthly
        dateGroup = {
            $dateToString: {
                format: '%Y-%m',
                date: '$date'
            }
        };
    }

    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: dateGroup,
                totalExpenseUSD: { $sum: { $ifNull: ['$amountUSD', '$amount'] } }
            }
        },
        { $sort: { _id: 1 } }
    ];
};

/**
 * Build aggregation pipeline for income trend data
 */
export const buildTrendIncomePipeline = (userId, startDate, endDate, granularity) => {
    let dateGroup;
    if (granularity === 'weekly') {
        dateGroup = {
            $dateToString: {
                format: '%G-W%V',
                date: '$date'
            }
        };
    } else if (granularity === 'yearly') {
        dateGroup = { $year: '$date' };
    } else {
        dateGroup = {
            $dateToString: {
                format: '%Y-%m',
                date: '$date'
            }
        };
    }

    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: dateGroup,
                totalIncomeUSD: { $sum: { $ifNull: ['$amountUSD', '$amount'] } }
            }
        },
        { $sort: { _id: 1 } }
    ];
};

/**
 * Build aggregation pipeline for category breakdown
 * Groups expenses or income by category for a specific period
 */
export const buildCategoryBreakdownPipeline = (userId, startDate, endDate) => {
    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: '$category',
                totalUSD: { $sum: { $ifNull: ['$amountUSD', '$amount'] } },
                count: { $sum: 1 }
            }
        },
        { $sort: { totalUSD: -1 } }
    ];
};

/**
 * Build aggregation pipeline for monthly comparison
 * Groups by month and calculates income/expense/savings
 */
export const buildMonthlyComparisonExpensePipeline = (userId, startDate, endDate) => {
    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m',
                        date: '$date'
                    }
                },
                totalExpenseUSD: { $sum: { $ifNull: ['$amountUSD', '$amount'] } }
            }
        },
        { $sort: { _id: 1 } }
    ];
};

export const buildMonthlyComparisonIncomePipeline = (userId, startDate, endDate) => {
    return [
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                date: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: '%Y-%m',
                        date: '$date'
                    }
                },
                totalIncomeUSD: { $sum: { $ifNull: ['$amountUSD', '$amount'] } }
            }
        },
        { $sort: { _id: 1 } }
    ];
};

/**
 * Merge expense and income stats into a unified series
 * @param {Array} expenseStats - Aggregated expense data
 * @param {Array} incomeStats - Aggregated income data
 * @returns {Array} Merged series with income, expense, savings
 */
export const mergeTrendData = (expenseStats, incomeStats) => {
    // Create maps for quick lookup
    const expenseMap = new Map(expenseStats.map(e => [String(e._id), e.totalExpenseUSD || 0]));
    const incomeMap = new Map(incomeStats.map(i => [String(i._id), i.totalIncomeUSD || 0]));

    // Get all unique periods
    const allPeriods = new Set([...expenseMap.keys(), ...incomeMap.keys()]);
    const sortedPeriods = Array.from(allPeriods).sort();

    // Build merged series
    return sortedPeriods.map(period => {
        const income = incomeMap.get(period) || 0;
        const expense = expenseMap.get(period) || 0;
        return {
            date: period,
            income: Math.round(income * 100) / 100,
            expense: Math.round(expense * 100) / 100,
            savings: Math.round((income - expense) * 100) / 100
        };
    });
};

/**
 * Get period label for display
 * @param {string} dateStr - Period string (e.g., '2026-01', '2026-W03', '2026')
 * @param {string} granularity - 'weekly' | 'monthly' | 'yearly'
 * @returns {string} Human-readable label
 */
export const getPeriodLabel = (dateStr, granularity) => {
    if (granularity === 'weekly') {
        // Already in W03 format
        return dateStr.includes('-W') ? `W${dateStr.split('-W')[1]}` : dateStr;
    } else if (granularity === 'yearly') {
        return String(dateStr);
    } else {
        // Monthly: convert 2026-01 to "Jan"
        const [year, month] = String(dateStr).split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'short' });
    }
};

/**
 * Calculate status based on usage percentage
 * @param {number} usage - Usage percentage (0-100+)
 * @returns {string} 'healthy' | 'warning' | 'critical' | 'exceeded'
 */
export const calculateBudgetStatus = (usage) => {
    if (usage > 100) return 'exceeded';
    if (usage >= 90) return 'critical';
    if (usage >= 70) return 'warning';
    return 'healthy';
};
