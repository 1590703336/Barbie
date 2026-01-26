/**
 * Analytics Controllers
 * 
 * Handles HTTP requests for analytics endpoints.
 * Follows existing patterns from budget.controllers.js
 */

import * as analyticsService from './analytics.services.js';
import * as expenseRepository from '../expenses/expense.repository.js';
import * as incomeRepository from '../income/income.repository.js';
import * as budgetRepository from '../budgets/budget.repository.js';
import { assertSameUserOrAdmin } from '../../utils/authorization.js';
import { convertFromUSD } from '../currency/currency.service.js';

/**
 * GET /api/analytics/trend
 * 
 * Returns income and expense trend data grouped by period (weekly/monthly/yearly)
 * 
 * Query params:
 *   - granularity: 'weekly' | 'monthly' | 'yearly' (default: 'monthly')
 *   - count: number of periods (default: 12)
 *   - userId: target user ID (admin only for other users)
 */
export const getTrendDataController = async (req, res, next) => {
    try {
        const granularity = req.query.granularity || 'monthly';
        const count = parseInt(req.query.count, 10) || 12;
        const targetUserId = req.query.userId || req.user._id;

        // Authorization check
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access trend data');

        // Build date range
        const { startDate, endDate } = analyticsService.buildDateRange(granularity, count);

        // Build aggregation pipelines
        const expensePipeline = analyticsService.buildTrendExpensePipeline(
            targetUserId, startDate, endDate, granularity
        );
        const incomePipeline = analyticsService.buildTrendIncomePipeline(
            targetUserId, startDate, endDate, granularity
        );

        // Execute aggregations in parallel
        const [expenseStats, incomeStats] = await Promise.all([
            expenseRepository.aggregate(expensePipeline),
            incomeRepository.aggregate(incomePipeline)
        ]);

        // Merge and format data
        const series = analyticsService.mergeTrendData(expenseStats, incomeStats);

        // Add labels for display
        const seriesWithLabels = series.map(item => ({
            ...item,
            name: analyticsService.getPeriodLabel(item.date, granularity)
        }));

        // Calculate totals
        const totals = seriesWithLabels.reduce(
            (acc, item) => ({
                income: acc.income + item.income,
                expense: acc.expense + item.expense,
                savings: acc.savings + item.savings
            }),
            { income: 0, expense: 0, savings: 0 }
        );

        // Convert to user's currency
        const userCurrency = req.user.defaultCurrency || 'USD';
        const convertedSeries = await Promise.all(
            seriesWithLabels.map(async (item) => ({
                ...item,
                income: await convertFromUSD(item.income, userCurrency),
                expense: await convertFromUSD(item.expense, userCurrency),
                savings: await convertFromUSD(item.savings, userCurrency)
            }))
        );

        res.json({
            success: true,
            data: {
                period: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0],
                    granularity
                },
                currency: userCurrency,
                series: convertedSeries,
                totals: {
                    income: await convertFromUSD(totals.income, userCurrency),
                    expense: await convertFromUSD(totals.expense, userCurrency),
                    savings: await convertFromUSD(totals.savings, userCurrency)
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/analytics/category-breakdown
 * 
 * Returns expense or income breakdown by category for a specific month/year
 * 
 * Query params:
 *   - type: 'expense' | 'income' (default: 'expense')
 *   - month: month (1-12) - required
 *   - year: year - required
 *   - limit: max categories to return (default: 10)
 *   - userId: target user ID (admin only for other users)
 */
export const getCategoryBreakdownController = async (req, res, next) => {
    try {
        const type = req.query.type || 'expense';
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        const limit = parseInt(req.query.limit, 10) || 10;
        const targetUserId = req.query.userId || req.user._id;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_REQUIRED_PARAM', message: 'Month and year are required' }
            });
        }

        // Authorization check
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access category breakdown');

        // Build date range for the month
        const { startDate, endDate } = analyticsService.buildMonthDateRange(month, year);

        // Build pipeline
        const pipeline = analyticsService.buildCategoryBreakdownPipeline(
            targetUserId, startDate, endDate
        );

        // Choose repository based on type
        const repository = type === 'income' ? incomeRepository : expenseRepository;
        const stats = await repository.aggregate(pipeline);

        // Calculate total
        const totalUSD = stats.reduce((sum, item) => sum + item.totalUSD, 0);

        // Convert to user's currency and add percentages
        const userCurrency = req.user.defaultCurrency || 'USD';

        // Apply limit and group remainder as 'Others'
        let categories = [];
        let othersTotal = 0;
        let othersCount = 0;

        for (let i = 0; i < stats.length; i++) {
            if (i < limit - 1 || stats.length <= limit) {
                categories.push({
                    category: stats[i]._id,
                    amount: await convertFromUSD(stats[i].totalUSD, userCurrency),
                    percentage: totalUSD > 0 ? Math.round((stats[i].totalUSD / totalUSD) * 10000) / 100 : 0,
                    count: stats[i].count
                });
            } else {
                othersTotal += stats[i].totalUSD;
                othersCount += stats[i].count;
            }
        }

        // Add "Others" category if needed
        if (othersTotal > 0) {
            categories.push({
                category: 'Others',
                amount: await convertFromUSD(othersTotal, userCurrency),
                percentage: totalUSD > 0 ? Math.round((othersTotal / totalUSD) * 10000) / 100 : 0,
                count: othersCount
            });
        }

        res.json({
            success: true,
            data: {
                period: {
                    month,
                    year,
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0]
                },
                currency: userCurrency,
                type,
                total: await convertFromUSD(totalUSD, userCurrency),
                categories
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/analytics/monthly-comparison
 * 
 * Returns income, expenses, and savings comparison across multiple months
 * 
 * Query params:
 *   - months: number of months to compare (default: 6)
 *   - userId: target user ID (admin only for other users)
 */
export const getMonthlyComparisonController = async (req, res, next) => {
    try {
        const monthsCount = parseInt(req.query.months, 10) || 6;
        const targetUserId = req.query.userId || req.user._id;

        // Authorization check
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access monthly comparison');

        // Build date range for N months
        const { startDate, endDate } = analyticsService.buildDateRange('monthly', monthsCount);

        // Build pipelines
        const expensePipeline = analyticsService.buildMonthlyComparisonExpensePipeline(
            targetUserId, startDate, endDate
        );
        const incomePipeline = analyticsService.buildMonthlyComparisonIncomePipeline(
            targetUserId, startDate, endDate
        );

        // Execute aggregations in parallel
        const [expenseStats, incomeStats] = await Promise.all([
            expenseRepository.aggregate(expensePipeline),
            incomeRepository.aggregate(incomePipeline)
        ]);

        // Merge data
        const mergedData = analyticsService.mergeTrendData(expenseStats, incomeStats);

        // Convert to user's currency and add savingsRate
        const userCurrency = req.user.defaultCurrency || 'USD';
        const months = await Promise.all(
            mergedData.map(async (item) => {
                const income = await convertFromUSD(item.income, userCurrency);
                const expense = await convertFromUSD(item.expense, userCurrency);
                const savings = await convertFromUSD(item.savings, userCurrency);
                const savingsRate = income > 0 ? Math.round((savings / income) * 10000) / 100 : 0;

                return {
                    month: item.date,
                    income,
                    expense,
                    savings,
                    savingsRate
                };
            })
        );

        // Calculate averages
        const totals = months.reduce(
            (acc, item) => ({
                income: acc.income + item.income,
                expense: acc.expense + item.expense,
                savings: acc.savings + item.savings
            }),
            { income: 0, expense: 0, savings: 0 }
        );

        const count = months.length || 1;
        const avgIncome = Math.round((totals.income / count) * 100) / 100;
        const avgExpense = Math.round((totals.expense / count) * 100) / 100;
        const avgSavings = Math.round((totals.savings / count) * 100) / 100;
        const avgSavingsRate = avgIncome > 0 ? Math.round((avgSavings / avgIncome) * 10000) / 100 : 0;

        res.json({
            success: true,
            data: {
                period: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0]
                },
                currency: userCurrency,
                months,
                averages: {
                    income: avgIncome,
                    expense: avgExpense,
                    savings: avgSavings,
                    savingsRate: avgSavingsRate
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/analytics/budget-usage
 * 
 * Returns budget utilization data per category for a specific month/year
 * This is similar to getBudgetStatisticsController but formatted for charts
 * 
 * Query params:
 *   - month: month (1-12) - required
 *   - year: year - required
 *   - sortBy: 'usage' | 'budget' | 'remaining' | 'category' (default: 'usage')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 *   - userId: target user ID (admin only for other users)
 */
export const getBudgetUsageController = async (req, res, next) => {
    try {
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        const sortBy = req.query.sortBy || 'usage';
        const sortOrder = req.query.sortOrder || 'desc';
        const targetUserId = req.query.userId || req.user._id;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_REQUIRED_PARAM', message: 'Month and year are required' }
            });
        }

        // Authorization check
        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access budget usage');

        // Get budgets for this month
        const budgets = await budgetRepository.find({
            user: targetUserId,
            month,
            year
        });

        // Get expenses for this month
        const { startDate, endDate } = analyticsService.buildMonthDateRange(month, year);
        const expensePipeline = analyticsService.buildCategoryBreakdownPipeline(
            targetUserId, startDate, endDate
        );
        const expenseStats = await expenseRepository.aggregate(expensePipeline);

        // Create expense map for quick lookup
        const expenseMap = new Map(
            expenseStats.map(e => [e._id, { total: e.totalUSD, count: e.count }])
        );

        // Convert to user's currency
        const userCurrency = req.user.defaultCurrency || 'USD';

        // Build category data
        let categories = await Promise.all(
            budgets.map(async (budget) => {
                const budgetUSD = budget.amountUSD || budget.limit;
                const expenseData = expenseMap.get(budget.category) || { total: 0, count: 0 };
                const spentUSD = expenseData.total;
                const remainingUSD = budgetUSD - spentUSD;
                const usage = budgetUSD > 0 ? Math.round((spentUSD / budgetUSD) * 10000) / 100 : 0;

                return {
                    category: budget.category,
                    budget: await convertFromUSD(budgetUSD, userCurrency),
                    spent: await convertFromUSD(spentUSD, userCurrency),
                    remaining: await convertFromUSD(remainingUSD, userCurrency),
                    usage,
                    status: analyticsService.calculateBudgetStatus(usage)
                };
            })
        );

        // Sort categories
        const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
        categories.sort((a, b) => {
            const aVal = sortBy === 'category' ? a.category : a[sortBy];
            const bVal = sortBy === 'category' ? b.category : b[sortBy];

            if (sortBy === 'category') {
                return aVal.localeCompare(bVal) * sortMultiplier;
            }
            return (aVal - bVal) * sortMultiplier;
        });

        // Calculate summary totals
        const totalBudgetUSD = budgets.reduce((sum, b) => sum + (b.amountUSD || b.limit), 0);
        const totalSpentUSD = expenseStats.reduce((sum, e) => sum + e.totalUSD, 0);
        const totalRemainingUSD = totalBudgetUSD - totalSpentUSD;
        const overallUsage = totalBudgetUSD > 0
            ? Math.round((totalSpentUSD / totalBudgetUSD) * 10000) / 100
            : 0;

        res.json({
            success: true,
            data: {
                period: { month, year },
                currency: userCurrency,
                summary: {
                    totalBudget: await convertFromUSD(totalBudgetUSD, userCurrency),
                    totalSpent: await convertFromUSD(totalSpentUSD, userCurrency),
                    totalRemaining: await convertFromUSD(totalRemainingUSD, userCurrency),
                    overallUsage
                },
                categories
            }
        });
    } catch (err) {
        next(err);
    }
};
