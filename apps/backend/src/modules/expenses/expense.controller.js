import { createExpense, getExpensesByUser, getExpense, updateExpense, deleteExpense } from "./expense.service.js";

// Create an expense
export const createExpenseController = async (req, res, next) => {
    try {
        const expense = await createExpense({ ...req.body, user: req.user._id });

        // Check budget alerts
        const { checkBudgetAlerts } = await import("../budgets/budgetAlertService.js");
        let alerts = [];

        const alertResult = await checkBudgetAlerts({
            userId: req.user._id.toString(),
            category: expense.category,
            month: expense.date.getUTCMonth() + 1,
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
        if (req.params.id) {
            const expense = await getExpense(req.params.id, { id: req.user._id.toString(), role: req.user.role });
            res.json(expense);
        } else {
            const targetUserId = req.query.userId || req.user._id;
            const expenses = await getExpensesByUser(
                targetUserId,
                { id: req.user._id.toString(), role: req.user.role }
            );
            res.json(expenses);
        }
    } catch (err) {
        next(err);
    }
}

// Update an expense`   
export const updateExpenseController = async (req, res, next) => {
    try {
        const updatedExpense = await updateExpense(
            req.params.id,
            req.body,
            { id: req.user._id.toString(), role: req.user.role }
        );
        res.json(updatedExpense);
    } catch (err) {
        next(err);
    }
}

// Delete an expense
export const deleteExpenseController = async (req, res, next) => {
    try {
        await deleteExpense(
            req.params.id,
            { id: req.user._id.toString(), role: req.user.role }
        );
        res.status(204).send({
            message: "Expense deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}