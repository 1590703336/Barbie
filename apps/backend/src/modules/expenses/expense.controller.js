import * as expenseRepository from './expense.repository.js';
import * as expenseService from './expense.service.js';
import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from "../../utils/authorization.js";

// Create an expense
export const createExpenseController = async (req, res, next) => {
    try {
        const processedData = await expenseService.prepareExpenseData({ ...req.body, user: req.user._id });
        const expense = await expenseRepository.create(processedData);

        // Check budget alerts
        const { checkBudgetAlerts } = await import("../budgets/budgetAlertService.js");
        let alerts = [];

        // Note: For budget alerts, we still rely on the expense object having a date method or property.
        // If expense is a Mongoose document, it has .date which is a Date object.
        const alertResult = await checkBudgetAlerts({
            userId: req.user._id.toString(),
            category: expense.category,
            month: expense.date.getUTCMonth() + 1, //getUTCMonth() returns 0-11
            year: expense.date.getUTCFullYear()
        });

        if (alertResult && alertResult.alerts.length > 0) {
            alerts = alertResult.alerts;
        }

        res.status(201).json({ ...expense.toJSON(), alerts });
    } catch (err) {
        next(err);
    }
}

// Get expenses
export const getExpensesController = async (req, res, next) => {
    try {
        const requester = { id: req.user._id.toString(), role: req.user.role };

        if (req.params.id) {
            // Get Single Expense
            const expense = await expenseRepository.findById(req.params.id);
            if (!expense) {
                throw buildError('Expense not found', 404);
            }
            assertOwnerOrAdmin(expense.user, requester, 'access this expense');
            res.json(expense);
        } else {
            // Get List of Expenses
            const targetUserId = req.query.userId || req.user._id;

            assertSameUserOrAdmin(targetUserId, requester, 'access these expenses');

            const filters = {
                month: req.query.month,
                year: req.query.year,
                category: req.query.category
            };

            const expenses = await expenseRepository.findByUser(targetUserId, filters);
            res.json(expenses);
        }
    } catch (err) {
        next(err);
    }
}

// Update an expense
export const updateExpenseController = async (req, res, next) => {
    try {
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingExpense = await expenseRepository.findById(req.params.id);
        if (!existingExpense) {
            throw buildError('Expense not found', 404);
        }

        assertOwnerOrAdmin(existingExpense.user, requester, 'update this expense');

        const processedData = await expenseService.prepareExpenseData(req.body, existingExpense);
        const updatedExpense = await expenseRepository.update(req.params.id, processedData);

        // Check budget alerts (only computes if budget exists for this category)
        const { checkBudgetAlerts } = await import("../budgets/budgetAlertService.js");
        let alerts = [];

        // checkBudgetAlerts returns null if no budget exists, so we can safely call it
        const alertResult = await checkBudgetAlerts({
            userId: req.user._id.toString(),
            category: updatedExpense.category,
            month: updatedExpense.date.getUTCMonth() + 1,
            year: updatedExpense.date.getUTCFullYear()
        });

        if (alertResult && alertResult.alerts.length > 0) {
            alerts = alertResult.alerts;
        }

        res.json({ ...updatedExpense.toJSON(), alerts });
    } catch (err) {
        next(err);
    }
}

// Delete an expense
export const deleteExpenseController = async (req, res, next) => {
    try {
        const requester = { id: req.user._id.toString(), role: req.user.role };

        const existingExpense = await expenseRepository.findById(req.params.id);
        if (!existingExpense) {
            throw buildError('Expense not found', 404);
        }

        assertOwnerOrAdmin(existingExpense.user, requester, 'delete this expense');

        await expenseRepository.deleteById(req.params.id);

        res.status(204).send({
            message: "Expense deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}