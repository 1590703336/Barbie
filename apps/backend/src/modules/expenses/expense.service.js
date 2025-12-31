import Expense from "./expense.model.js";
import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from "../../utils/authorization.js";

// Create expense
export const createExpense = async (expense) => Expense.create(expense);

// Get all expenses for a user
export const getExpensesByUser = async (userId, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these expenses');
  return Expense.find({ user: userId });
};

// Get a single expense
export const getExpense = async (id, requester) => {
  const expense = await Expense.findById(id);
  if (!expense) {
    throw buildError('Expense not found', 404);
  }
  assertOwnerOrAdmin(expense.user, requester, 'access this expense');
  return expense;
};

// Update expense
export const updateExpense = async (id, data, requester) => {
  await getExpense(id, requester);
  return Expense.findByIdAndUpdate(id, data, { new: true });
};

// Delete expense
export const deleteExpense = async (id, requester) => {
  await getExpense(id, requester);
  return Expense.findByIdAndDelete(id);
};

// Get expenses by user and date (month and year)
export const getTotalExpensesByUserAndDate = async (userId, month, year, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these expenses');
  // Start: first day of month at 00:00:00
  const start = new Date(year, month - 1, 1);
  // End: last day of month at 23:59:59.999
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await Expense.find({
    user: userId,
    date: { $gte: start, $lte: end } 
  });

  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// total expense for a specific category, month, year and user
export const getTotalExpensesByCategoryAndDate = async (userId, category, month, year, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these expenses');
  // Start: first day of month at 00:00:00
  const start = new Date(year, month - 1, 1);
  // End: last day of month at 23:59:59.999
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await Expense.find({
    user: userId,
    category,
    date: { $gte: start, $lte: end }
  });

  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

// check if an an user has a specific expense category
export const hasExpenseCategory = async (userId, category) => {
  const expenses = await Expense.find({ user: userId, category });
  return expenses.length > 0;
};