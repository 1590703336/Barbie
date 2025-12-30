import Budget from "./budget.model.js";

// function to get budget for specific month and year and user
export const getBudgetsByUserAndDate = async (userId, month, year) => {
  return await Budget.find({ user: userId, month, year });
}

// edit budget with a budget ID
export const updateBudget = async (budgetId, updates) => {
  return await Budget.findByIdAndUpdate(budgetId, updates, { new: true });
}

// delete budget with a budget ID
export const deleteBudget = async (budgetId) => {
  return await Budget.findByIdAndDelete(budgetId);
}

// create a new budget with a budget object
export const createBudget = async (budget) => {
  return await Budget.create(budget);
}

// get budget by ID
export const getBudgetById = async (budgetId) => {
  return await Budget.findById(budgetId);
}