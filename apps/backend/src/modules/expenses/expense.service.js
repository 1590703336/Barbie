import Expense from "./expense.model.js";

// Create expense
export const createExpense = async (expense) => Expense.create(expense);

// Get all expenses for a user
export const getExpensesByUser = async (userId) => Expense.find({ user: userId });

// Get a single expense
export const getExpense = async (id) => Expense.findById(id);

// Update expense
export const updateExpense = async (id, data) =>
  Expense.findByIdAndUpdate(id, data, { new: true });

// Delete expense
export const deleteExpense = async (id) => Expense.findByIdAndDelete(id);
