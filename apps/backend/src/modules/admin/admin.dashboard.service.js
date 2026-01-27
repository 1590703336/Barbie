/**
 * Admin Dashboard Service
 * 
 * Business logic and aggregation pipelines for platform-wide analytics.
 * Uses Date.UTC() for all date calculations to avoid timezone bugs.
 */

import mongoose from 'mongoose';
import User from '../user/user.model.js';
import Expense from '../expenses/expense.model.js';
import Income from '../income/income.model.js';
import Budget from '../budgets/budget.model.js';
import Subscription from '../subscription/subscription.model.js';
import ConvertPair from '../convertPair/convertPair.model.js';

/**
 * Get Platform Overview Statistics
 * Returns high-level KPIs for the admin dashboard.
 */
export const getPlatformOverview = async () => {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const endOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));

    // Total users
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = totalUsers - adminCount;

    // New users this month
    const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth }
    });

    // New users last month (for comparison)
    const newUsersLastMonth = await User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // Total transactions (expenses + income)
    const totalExpenses = await Expense.countDocuments();
    const totalIncomes = await Income.countDocuments();
    const totalTransactions = totalExpenses + totalIncomes;

    // Total volume in USD
    const expenseVolumeResult = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amountUSD' } } }
    ]);
    const incomeVolumeResult = await Income.aggregate([
        { $group: { _id: null, total: { $sum: '$amountUSD' } } }
    ]);
    const totalExpenseVolume = expenseVolumeResult[0]?.total || 0;
    const totalIncomeVolume = incomeVolumeResult[0]?.total || 0;

    // Active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    return {
        users: {
            total: totalUsers,
            admins: adminCount,
            regular: userCount,
            newThisMonth: newUsersThisMonth,
            newLastMonth: newUsersLastMonth,
            growthRate: newUsersLastMonth > 0
                ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
                : null
        },
        transactions: {
            total: totalTransactions,
            expenses: totalExpenses,
            incomes: totalIncomes
        },
        volume: {
            totalExpenseUSD: totalExpenseVolume,
            totalIncomeUSD: totalIncomeVolume,
            netCashFlowUSD: totalIncomeVolume - totalExpenseVolume
        },
        subscriptions: {
            active: activeSubscriptions
        }
    };
};

/**
 * Get User Growth Trend
 * Returns user registration counts grouped by period.
 */
export const getUserGrowthTrend = async (granularity = 'monthly', count = 12) => {
    const now = new Date();
    let startDate;
    let dateFormat;
    let periodLabel;

    switch (granularity) {
        case 'weekly':
            startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (count * 7)));
            dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
            periodLabel = 'week';
            break;
        case 'yearly':
            startDate = new Date(Date.UTC(now.getUTCFullYear() - count, 0, 1));
            dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
            periodLabel = 'year';
            break;
        case 'monthly':
        default:
            startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count, 1));
            dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            periodLabel = 'month';
    }

    const pipeline = [
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: dateFormat,
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                period: '$_id',
                count: 1,
                _id: 0
            }
        }
    ];

    const results = await User.aggregate(pipeline);

    return {
        granularity,
        periodLabel,
        data: results
    };
};

/**
 * Get Platform-wide Financial Summary
 * Returns aggregated income/expenses/savings for the entire platform.
 */
export const getPlatformFinancials = async (months = 6) => {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));

    const expensePipeline = [
        { $match: { date: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                total: { $sum: '$amountUSD' }
            }
        },
        { $sort: { _id: 1 } }
    ];

    const incomePipeline = [
        { $match: { date: { $gte: startDate } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                total: { $sum: '$amountUSD' }
            }
        },
        { $sort: { _id: 1 } }
    ];

    const [expenses, incomes] = await Promise.all([
        Expense.aggregate(expensePipeline),
        Income.aggregate(incomePipeline)
    ]);

    // Merge into unified series
    const monthMap = new Map();

    expenses.forEach(e => {
        monthMap.set(e._id, { period: e._id, expense: e.total, income: 0 });
    });

    incomes.forEach(i => {
        if (monthMap.has(i._id)) {
            monthMap.get(i._id).income = i.total;
        } else {
            monthMap.set(i._id, { period: i._id, expense: 0, income: i.total });
        }
    });

    const data = Array.from(monthMap.values())
        .sort((a, b) => a.period.localeCompare(b.period))
        .map(item => ({
            ...item,
            savings: item.income - item.expense
        }));

    return { data };
};

/**
 * Get Platform-wide Category Distribution
 * Returns expense breakdown by category across all users.
 */
export const getCategoryDistribution = async (type = 'expense', month, year) => {
    const now = new Date();
    const targetMonth = month || now.getUTCMonth() + 1;
    const targetYear = year || now.getUTCFullYear();

    const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const Model = type === 'income' ? Income : Expense;

    const pipeline = [
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amountUSD' },
                count: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } },
        {
            $project: {
                category: '$_id',
                total: 1,
                count: 1,
                _id: 0
            }
        }
    ];

    const results = await Model.aggregate(pipeline);

    const grandTotal = results.reduce((sum, item) => sum + item.total, 0);

    return {
        type,
        month: targetMonth,
        year: targetYear,
        grandTotal,
        data: results.map(item => ({
            ...item,
            percentage: grandTotal > 0 ? (item.total / grandTotal * 100).toFixed(1) : 0
        }))
    };
};

/**
 * Get Budget Compliance Metrics
 * Returns how many users are within/over budget.
 */
export const getBudgetCompliance = async (month, year) => {
    const now = new Date();
    const targetMonth = month || now.getUTCMonth() + 1;
    const targetYear = year || now.getUTCFullYear();

    // Get all budgets for the period
    const budgets = await Budget.find({ month: targetMonth, year: targetYear });

    if (budgets.length === 0) {
        return {
            month: targetMonth,
            year: targetYear,
            totalBudgets: 0,
            withinBudget: 0,
            overBudget: 0,
            complianceRate: null
        };
    }

    const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    let withinBudget = 0;
    let overBudget = 0;

    for (const budget of budgets) {
        const expenseTotal = await Expense.aggregate([
            {
                $match: {
                    user: budget.user,
                    category: budget.category,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: null, total: { $sum: '$amountUSD' } } }
        ]);

        const spent = expenseTotal[0]?.total || 0;
        const budgetLimit = budget.amountUSD || budget.limit;

        if (spent <= budgetLimit) {
            withinBudget++;
        } else {
            overBudget++;
        }
    }

    return {
        month: targetMonth,
        year: targetYear,
        totalBudgets: budgets.length,
        withinBudget,
        overBudget,
        complianceRate: (withinBudget / budgets.length * 100).toFixed(1)
    };
};

/**
 * Get Subscription Health Metrics
 */
export const getSubscriptionHealth = async () => {
    const statusCounts = await Subscription.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$amountUSD' }
            }
        }
    ]);

    const categoryCounts = await Subscription.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalValue: { $sum: '$amountUSD' }
            }
        },
        { $sort: { totalValue: -1 } }
    ]);

    const result = {
        byStatus: {},
        byCategory: []
    };

    statusCounts.forEach(s => {
        result.byStatus[s._id] = { count: s.count, totalValueUSD: s.totalValue };
    });

    result.byCategory = categoryCounts.map(c => ({
        category: c._id,
        count: c.count,
        totalValueUSD: c.totalValue
    }));

    return result;
};

/**
 * Get Popular Currency Pairs and Currency Statistics
 */
export const getPopularCurrencyPairs = async () => {
    // Get popular conversion pairs
    const pairCounts = await ConvertPair.aggregate([
        {
            $group: {
                _id: { from: '$fromCurrency', to: '$toCurrency' },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
            $project: {
                from: '$_id.from',
                to: '$_id.to',
                count: 1,
                _id: 0
            }
        }
    ]);

    // Get total conversion pairs count
    const totalPairs = await ConvertPair.countDocuments();

    // Get unique currencies used across the platform (from expenses, incomes, subscriptions)
    const [expenseCurrencies, incomeCurrencies, subscriptionCurrencies] = await Promise.all([
        Expense.distinct('currency'),
        Income.distinct('currency'),
        Subscription.distinct('currency')
    ]);

    const allCurrencies = new Set([...expenseCurrencies, ...incomeCurrencies, ...subscriptionCurrencies]);
    const uniqueCurrencies = allCurrencies.size;

    // Get default currency distribution with percentages
    const totalUsers = await User.countDocuments();
    const currencyUsage = await User.aggregate([
        {
            $group: {
                _id: '$defaultCurrency',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const defaultCurrencies = currencyUsage.map(c => ({
        currency: c._id || 'USD',
        count: c.count,
        percentage: totalUsers > 0 ? (c.count / totalUsers * 100).toFixed(1) : 0
    }));

    // Find most popular default currency
    const mostPopular = defaultCurrencies.length > 0 ? defaultCurrencies[0].currency : 'USD';

    return {
        uniqueCurrencies,
        totalPairs,
        mostPopular,
        popularPairs: pairCounts,
        defaultCurrencies
    };
};

/**
 * Get All Users with Filtering and Pagination
 */
export const getAllUsers = async (options = {}) => {
    const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = options;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (role) {
        query.role = role;
    }

    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password -__v')
            .sort({ [sortBy]: sortDirection })
            .skip(skip)
            .limit(limit),
        User.countDocuments(query)
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get User Activity Summary with Detailed Records
 * Returns summary counts plus month-by-month expense/income records
 */
export const getUserActivity = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1));

    // Get counts
    const [expenseCount, incomeCount, budgetCount, subscriptionCount] = await Promise.all([
        Expense.countDocuments({ user: userObjectId }),
        Income.countDocuments({ user: userObjectId }),
        Budget.countDocuments({ user: userObjectId }),
        Subscription.countDocuments({ user: userObjectId })
    ]);

    // Get totals
    const [totalExpense, totalIncome] = await Promise.all([
        Expense.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: null, total: { $sum: '$amountUSD' } } }
        ]),
        Income.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: null, total: { $sum: '$amountUSD' } } }
        ])
    ]);

    // Get expenses grouped by month (last 6 months)
    const expensesByMonth = await Expense.aggregate([
        { $match: { user: userObjectId, date: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                records: {
                    $push: {
                        title: '$title',
                        amount: '$amount',
                        currency: '$currency',
                        amountUSD: '$amountUSD',
                        category: '$category',
                        date: '$date'
                    }
                },
                totalUSD: { $sum: '$amountUSD' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    // Get incomes grouped by month (last 6 months)
    const incomesByMonth = await Income.aggregate([
        { $match: { user: userObjectId, date: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
                records: {
                    $push: {
                        title: '$title',
                        amount: '$amount',
                        currency: '$currency',
                        amountUSD: '$amountUSD',
                        category: '$category',
                        date: '$date'
                    }
                },
                totalUSD: { $sum: '$amountUSD' },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: -1 } }
    ]);

    // Get all subscriptions
    const subscriptions = await Subscription.find({ user: userObjectId })
        .select('name price currency amountUSD category status frequency startDate renewalDate')
        .sort({ renewalDate: 1 });

    // Get all budgets
    const budgets = await Budget.find({ user: userObjectId })
        .select('category limit currency year month')
        .sort({ year: -1, month: -1 });

    return {
        counts: {
            expenses: expenseCount,
            incomes: incomeCount,
            budgets: budgetCount,
            subscriptions: subscriptionCount
        },
        totals: {
            expenseUSD: totalExpense[0]?.total || 0,
            incomeUSD: totalIncome[0]?.total || 0
        },
        records: {
            expenses: expensesByMonth.map(m => ({
                month: m._id,
                totalUSD: m.totalUSD,
                count: m.count,
                items: m.records
            })),
            incomes: incomesByMonth.map(m => ({
                month: m._id,
                totalUSD: m.totalUSD,
                count: m.count,
                items: m.records
            })),
            subscriptions: subscriptions.map(s => ({
                name: s.name,
                price: s.price,
                currency: s.currency,
                amountUSD: s.amountUSD,
                category: s.category,
                status: s.status,
                frequency: s.frequency,
                renewalDate: s.renewalDate
            })),
            budgets: budgets.map(b => ({
                category: b.category,
                limit: b.limit,
                currency: b.currency,
                year: b.year,
                month: b.month
            }))
        }
    };
};

/**
 * Update User Role
 */
export const updateUserRole = async (userId, newRole) => {
    const user = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Delete User and All Associated Data
 */
export const deleteUser = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Delete all user data (cascade delete)
    await Promise.all([
        Expense.deleteMany({ user: userObjectId }),
        Income.deleteMany({ user: userObjectId }),
        Budget.deleteMany({ user: userObjectId }),
        Subscription.deleteMany({ user: userObjectId }),
        ConvertPair.deleteMany({ user: userObjectId })
    ]);

    // Delete the user
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return { deleted: true, userId };
};
