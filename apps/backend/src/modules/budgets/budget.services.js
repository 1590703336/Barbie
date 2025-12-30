import Budget from "./budget.model.js";
import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from "../../utils/authorization.js";
import { convertToUSD } from '../currency/currency.service.js';

// function to get budget for specific month and year and user with authorization
export const getBudgetsByUserAndDate = async (userId, month, year, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these budgets');
  return await Budget.find({ user: userId, month, year });
};

// edit budget with a budget ID, scoped to owner unless admin
export const updateBudget = async (budgetId, updates, requester) => {
  const budget = await Budget.findById(budgetId);
  if (!budget) {
    throw buildError('Budget not found', 404);
  }
  assertOwnerOrAdmin(budget.user, requester, 'update this budget');


  if (updates.limit || updates.currency) {
    const limit = updates.limit || budget.limit;
    const currency = updates.currency || budget.currency;
    updates.amountUSD = await convertToUSD(limit, currency);
  }

  return await Budget.findByIdAndUpdate(budgetId, updates, { new: true });
};

// delete budget with a budget ID, scoped to owner unless admin
export const deleteBudget = async (budgetId, requester) => {
  const budget = await Budget.findById(budgetId);
  if (!budget) {
    throw buildError('Budget not found', 404);
  }
  assertOwnerOrAdmin(budget.user, requester, 'delete this budget');
  return await Budget.findByIdAndDelete(budgetId);
};

// create a new budget with a budget object

export const createBudget = async (budget) => {
  if (budget.limit && budget.currency) {
    budget.amountUSD = await convertToUSD(budget.limit, budget.currency);
  }
  return await Budget.create(budget);
};

// get budget by ID
export const getBudgetById = async (budgetId) => {
  return await Budget.findById(budgetId);
};

// total budget in for a specific month and year and user
export const getTotalBudgetByUserAndDate = async (userId, month, year, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these budgets');
  const budgets = await Budget.find({ user: userId, month, year });
  return budgets.reduce((total, budget) => total + (budget.amountUSD || budget.limit), 0); // budget.amountUSD is the amount in USD, budget.limit is the amount in the user's currency
};

// total budget for a specific category, month, year and user
export const getTotalBudgetByCategoryAndDate = async (userId, category, month, year, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these budgets');
  const budgets = await Budget.find({ user: userId, category, month, year });
  return budgets.reduce((total, budget) => total + (budget.amountUSD || budget.limit), 0); // budget.amountUSD is the amount in USD, budget.limit is the amount in the user's currency
};

// get all categories with budgets for a user in a specific month and year
export const getBudgetCategoriesByUserAndDate = async (userId, month, year, requester) => {
  assertSameUserOrAdmin(userId, requester, 'access these budgets');
  const budgets = await Budget.find({ user: userId, month, year });
  return budgets.map(budget => budget.category);
};