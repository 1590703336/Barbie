import * as budgetService from './budget.services.js';
import * as expenseService from '../expenses/expense.service.js';

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

        const budgets = await budgetService.getBudgetsByUserAndDate(
            targetUserId,
            month,
            year,
            { id: req.user._id.toString(), role: req.user.role }
        );
        res.json({ success: true, data: budgets });

    } catch (err) {
        next(err);
    }
};


// controller to update budget by ID
export const updateBudgetController = async (req, res, next) => {
    try {
        const updatedBudget = await budgetService.updateBudget(
            req.params.id,
            req.body,
            { id: req.user._id.toString(), role: req.user.role }
        );
        res.json({ success: true, message: "Budget updated successfully", data: updatedBudget });

    } catch (err) {
        next(err);
    }
}

// controller to delete budget by ID
export const deleteBudgetController = async (req, res, next) => {
    try {
        await budgetService.deleteBudget(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
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
        const budget = await budgetService.createBudget({ ...req.body, user: req.user._id });
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

        const categories = await budgetService.getBudgetCategoriesByUserAndDate( // get all budget categories for a specific month and year for a user
            targetUserId,
            month,
            year,
            { id: req.user._id.toString(), role: req.user.role }
        );
        res.status(200).json({ success: true, data: categories });

    } catch (err) {
        next(err);
    }
}
//example res:
// {
//     "success": true,
//     "data": [
//         "Food",
//         "Transport",
//         "Entertainment",
//         "Shopping",
//         "Health",
//         "Education",
//         "Utilities",
//         "Others"
//     ]
// }

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

        // calculate total budget and total expenses
        const totalBudgetUSD = await budgetService.getTotalBudgetByUserAndDate(
            targetUserId,
            month,
            year,
            { id: req.user._id.toString(), role: req.user.role }
        );
        const totalExpensesUSD = await expenseService.getTotalExpensesByUserAndDate(
            targetUserId,
            month,
            year,
            { id: req.user._id.toString(), role: req.user.role }
        );

        // getting all categories with budgets for the user in the specified month and year
        const categories = await budgetService.getBudgetCategoriesByUserAndDate(
            targetUserId,
            month,
            year,
            { id: req.user._id.toString(), role: req.user.role }
        );

        // filter to check if category exists in expenses
        const categoriesWithExpenses = categories.filter(category => {
            return expenseService.hasExpenseCategory(targetUserId, category);
        });

        const userCurrency = req.user.defaultCurrency || 'USD';

        // prepare category-wise summary
        const categoriesSummary = [];
        for (const category of categoriesWithExpenses) {
            const categoryBudgetUSD = await budgetService.getTotalBudgetByCategoryAndDate(
                targetUserId,
                category,
                month,
                year,
                { id: req.user._id.toString(), role: req.user.role }
            );
            const categoryExpensesUSD = await expenseService.getTotalExpensesByCategoryAndDate(
                targetUserId,
                category,
                month,
                year,
                { id: req.user._id.toString(), role: req.user.role }
            );

            categoriesSummary.push({
                category,
                budget: await convertFromUSD(categoryBudgetUSD, userCurrency),
                remainingBudget: await convertFromUSD(categoryBudgetUSD - categoryExpensesUSD, userCurrency),
                expenses: await convertFromUSD(categoryExpensesUSD, userCurrency)
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