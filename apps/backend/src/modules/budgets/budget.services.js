import Budget from "./budget.model.js";

// function to get budget for specific month and year and user
export const getBudgetsByUserAndDate = async (userId, month, year) => {
  return await Budget.find({ user: userId, month, year });
}

// edit budget with a budget ID, scoped to owner unless admin
export const updateBudget = async (budgetId, updates, userId, isAdmin = false) => {
  const query = isAdmin ? { _id: budgetId } : { _id: budgetId, user: userId };
  return await Budget.findOneAndUpdate(query, updates, { new: true });
}

// delete budget with a budget ID, scoped to owner unless admin
export const deleteBudget = async (budgetId, userId, isAdmin = false) => {
  const query = isAdmin ? { _id: budgetId } : { _id: budgetId, user: userId };
  return await Budget.findOneAndDelete(query);
}

// create a new budget with a budget object
export const createBudget = async (budget) => {
  return await Budget.create(budget);
}

// get budget by ID
export const getBudgetById = async (budgetId) => {
  return await Budget.findById(budgetId);
}

// total budget in for a specific month and year and user
export const getTotalBudgetByUserAndDate = async (userId, month, year) => {
  const budgets = await Budget.find({ user: userId, month, year });
  return budgets.reduce((total, budget) => total + budget.limit, 0);
}

// total budget for a specific category, month, year and user
export const getTotalBudgetByCategoryAndDate = async (userId, category, month, year) => {
  const budgets = await Budget.find({ user: userId, category, month, year });
  return budgets.reduce((total, budget) => total + budget.limit, 0);
}

// get all categories with budgets for a user in a specific month and year
export const getBudgetCategoriesByUserAndDate = async (userId, month, year) => {
  const budgets = await Budget.find({ user: userId, month, year });
  return budgets.map(budget => budget.category);
}