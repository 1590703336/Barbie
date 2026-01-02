import * as budgetService from './budget.services.js';
import * as budgetRepository from './budget.repository.js';
import * as expenseService from '../expenses/expense.service.js';
import * as expenseRepository from '../expenses/expense.repository.js';
import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from '../../utils/authorization.js';

import { convertFromUSD } from '../currency/currency.service.js';

// controller to get budgets for specific month and year and user
export const getBudgetsController = async (req, res, next) => {
    try {
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        const targetUserId = req.query.userId || req.user._id;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access these budgets');

        const budgets = await budgetRepository.find({ user: targetUserId, month, year });
        res.json({ success: true, data: budgets });

    } catch (err) {
        next(err);
    }
};


// controller to update budget by ID
export const updateBudgetController = async (req, res, next) => {
    try {
        const budgetId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingBudget = await budgetRepository.findById(budgetId);
        if (!existingBudget) {
            throw buildError('Budget not found', 404);
        }

        assertOwnerOrAdmin(existingBudget.user, requester, 'update this budget');

        const updates = await budgetService.prepareBudgetData(req.body, existingBudget);
        const updatedBudget = await budgetRepository.update(budgetId, updates);

        res.json({ success: true, message: "Budget updated successfully", data: updatedBudget });

    } catch (err) {
        next(err);
    }
}

// controller to delete budget by ID
export const deleteBudgetController = async (req, res, next) => {
    try {
        const budgetId = req.params.id;
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingBudget = await budgetRepository.findById(budgetId);
        if (!existingBudget) {
            throw buildError('Budget not found', 404);
        }

        assertOwnerOrAdmin(existingBudget.user, requester, 'delete this budget');
        await budgetRepository.deleteById(budgetId);

        res.status(204).send({
            success: true,
            message: "Budget deleted successfully"
        });

    } catch (err) {
        next(err);
    }
}

// controller to create a new budget
export const createBudgetController = async (req, res, next) => {
    try {
        const budgetData = await budgetService.prepareBudgetData({ ...req.body, user: req.user._id });
        const budget = await budgetRepository.create(budgetData);
        res.status(201).json({ success: true, message: "Budget created successfully", data: budget });

    } catch (err) {
        next(err);
    }
}

export const getBudgetCategoriesSummaryController = async (req, res, next) => { // controller to get all budget categories for a specific month and year for a user
    try {
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        const targetUserId = req.query.userId || req.user._id; // if the requester is an admin, use the target user id, otherwise use the requester id

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access these budgets');

        const budgets = await budgetRepository.find({ user: targetUserId, month, year });
        const categories = budgets.map(b => b.category);

        res.status(200).json({ success: true, data: categories });

    } catch (err) {
        next(err);
    }
}

// controller to get summary of budgets and expenses
export const getBudgetStatisticsController = async (req, res, next) => {
    try {
        // extract the month and year from query parameters
        const month = parseInt(req.query.month, 10);
        const year = parseInt(req.query.year, 10);
        const targetUserId = req.query.userId || req.user._id;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const requester = { id: req.user._id.toString(), role: req.user.role };
        assertSameUserOrAdmin(targetUserId, requester, 'access these stats');

        // Build Pipelines
        const budgetPipeline = budgetService.buildMonthlyStatsPipeline(targetUserId, month, year);
        const expensePipeline = expenseService.buildMonthlyStatsPipeline(targetUserId, month, year);

        // Fetch aggregated stats via Repositories
        const [budgetStats, expenseStats] = await Promise.all([
            budgetRepository.aggregate(budgetPipeline),
            expenseRepository.aggregate(expensePipeline)
        ]);

        const userCurrency = req.user.defaultCurrency || 'USD';

        // Helper to find stat by category
        const findStat = (stats, category) => stats.find(s => s._id === category);

        // Calculate totals
        const totalBudgetUSD = budgetStats.reduce((sum, item) => sum + item.totalBudgetUSD, 0);
        const totalExpensesUSD = expenseStats.reduce((sum, item) => sum + item.totalExpensesUSD, 0);

        // Prepare category summary
        const categoriesSummary = [];

        // Iterate through all budget categories
        for (const bStat of budgetStats) {
            const category = bStat._id;
            const budgetUSD = bStat.totalBudgetUSD;
            const eStat = findStat(expenseStats, category);
            const expensesUSD = eStat ? eStat.totalExpensesUSD : 0;


            categoriesSummary.push({
                category,
                budget: await convertFromUSD(budgetUSD, userCurrency),
                remainingBudget: await convertFromUSD(budgetUSD - expensesUSD, userCurrency),
                expenses: await convertFromUSD(expensesUSD, userCurrency)
            });
        }

        // send the final summary response
        res.status(200).json({
            success: true,
            data: {
                totalBudget: await convertFromUSD(totalBudgetUSD, userCurrency),
                totalExpenses: await convertFromUSD(totalExpensesUSD, userCurrency),
                remainingBudget: await convertFromUSD(totalBudgetUSD - totalExpensesUSD, userCurrency),
                categoriesSummary
            }
        });

    }
    catch (err) {
        next(err);
    }
}
// example res:
// {
//     "success": true,
//     "data": {
//         "totalBudget": 1000,
//         "totalExpenses": 500,
//         "remainingBudget": 500,
//         "categoriesSummary": [
//             {
//                 "category": "Food",
//                 "budget": 200,
//                 "remainingBudget": 100,
//                 "expenses": 100
//             },
//             {
//                 "category": "Transport",
//                 "budget": 100,
//                 "remainingBudget": 50,
//                 "expenses": 50
//             },
//             {
//                 "category": "Education",
//                 "budget": 100,
//                 "remainingBudget": 50,
//                 "expenses": 50
//             },
//             {
//                 "category": "Utilities",
//                 "budget": 100,
//                 "remainingBudget": 50,
//                 "expenses": 50
//             },
//             {
//                 "category": "Others",
//                 "budget": 100,
//                 "remainingBudget": 50,
//                 "expenses": 50
//             }
//         ]
//     }
// }