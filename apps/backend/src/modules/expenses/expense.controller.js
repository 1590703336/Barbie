import { createExpense, getExpensesByUser, getExpense, updateExpense, deleteExpense } from "./expense.service.js";

const isOwnerOrAdmin = (expense, user) => {
    if (!expense || !user) return false;
    if (user.role === 'admin') return true;
    return expense.user?.toString() === user._id.toString();
};

// Create an expense
export const createExpenseController = async (req, res, next) => {
    try {
        const expense = await createExpense({ ...req.body, user: req.user._id });
        res.status(201).json(expense);
    } catch (err) {
        next(err);
    }
}

// Get expenses
export const getExpensesController = async (req, res, next) => {
    try {
        if (req.params.id) {
            const expense = await getExpense(req.params.id);
            if (!expense) {
                return res.status(404).json({ message: "Expense not found" });
            }
            if (!isOwnerOrAdmin(expense, req.user)) {
                return res.status(403).json({ message: "You are not authorized to access this resource" });
            }
            res.json(expense);
        } else {
            const targetUserId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;
            const expenses = await getExpensesByUser(targetUserId);
            res.json(expenses);
        }
    } catch (err) {
        next(err);
    }
}

// Update an expense`   
export const updateExpenseController = async (req, res, next) => {
    try {
        const expense = await getExpense(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        if (!isOwnerOrAdmin(expense, req.user)) {
            return res.status(403).json({ message: "You are not authorized to update this resource" });
        }
        const updatedExpense = await updateExpense(req.params.id, req.body);
        res.json(updatedExpense);
    } catch (err) {
        next(err);
    }
}

// Delete an expense
export const deleteExpenseController = async (req, res, next) => {
    try {
        const expense = await getExpense(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }
        if (!isOwnerOrAdmin(expense, req.user)) {
            return res.status(403).json({ message: "You are not authorized to delete this resource" });
        }
        await deleteExpense(req.params.id);
        res.status(204).send({
            message: "Expense deleted successfully"
        });
    } catch (err) {
        next(err);
    }
}