import * as budgetService from './budget.services.js';
import * as expenseService from '../expenses/expense.service.js';
import Expense from '../expenses/expense.model.js';
import mongoose from 'mongoose';

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
      res.json({ success: true, data: budgets});

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
        res.json({ success: true, message: "Budget updated successfully", data: updatedBudget});

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
        res.status(201).json({ success: true, message: "Budget created successfully", data: budget});
        
    } catch (err) {
        next(err);
    }
}
// controller to get all budget categories for a specific month and year for a user
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
        res.status(200).json({ success: true, data: categories});

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

        // calculate total budget and total expenses
        const totalBudget = await budgetService.getTotalBudgetByUserAndDate(
            targetUserId,
            month,
            year,
            { id: req.user._id.toString(), role: req.user.role }
        );
        const totalExpenses = await expenseService.getTotalExpensesByUserAndDate(
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
        const categoriesWithExpenses = [];

        for (const category of categories) {
            const hasExpenses = await expenseService.hasExpenseCategory(
                targetUserId,
                category
            );

            if (hasExpenses) {
                categoriesWithExpenses.push(category);
            }
        }
        // prepare category-wise summary
        const categoriesSummary = [];
        for (const category of categoriesWithExpenses) {
            const categoryBudget = await budgetService.getTotalBudgetByCategoryAndDate(
                targetUserId,
                category,
                month,
                year,
                { id: req.user._id.toString(), role: req.user.role }
            );
            const categoryExpenses = await expenseService.getTotalExpensesByCategoryAndDate(
                targetUserId,
                category,
                month,
                year,
                { id: req.user._id.toString(), role: req.user.role }
            );

            categoriesSummary.push({
                category,
                budget: categoryBudget,
                remainingBudget: categoryBudget - categoryExpenses,
                expenses: categoryExpenses
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
            totalBudget,
            totalExpenses,
            remainingBudget: totalBudget - totalExpenses,
            categoriesSummary
            }
        });

    }
    catch (err) {
        next(err);
    }
}

