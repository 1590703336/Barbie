import { convertToUSD } from '../currency/currency.service.js';
import mongoose from 'mongoose'; // Only for Types.ObjectId if needed for pipeline construction

// Prepare budget data (creation or update) by calculating USD amount
export const prepareBudgetData = async (budgetData, existingBudget = {}) => {
  const processedData = { ...budgetData };

  // If currency or limit is being updated, or if it's a new budget
  if (processedData.limit !== undefined || processedData.currency) {
    const limit = processedData.limit !== undefined ? processedData.limit : existingBudget.limit;
    const currency = processedData.currency || existingBudget.currency;

    // Calculate new USD amount
    if (limit !== undefined && currency) {
      processedData.amountUSD = await convertToUSD(limit, currency);
    }
  }

  return processedData;
};

// Build aggregation pipeline for monthly budget stats
export const buildMonthlyStatsPipeline = (userId, month, year) => {
  return [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        month: month,
        year: year
      }
    },
    {
      $group: {
        _id: "$category",
        totalBudgetUSD: { $sum: { $ifNull: ["$amountUSD", "$limit"] } } // fallback to limit if amountUSD is missing
      }
    }
  ];
};

// Find the last non-empty month with budgets for a user (searches up to 12 months back)
export const findLastNonEmptyMonth = async (budgetRepository, userId, beforeMonth, beforeYear) => {
  let searchMonth = beforeMonth;
  let searchYear = beforeYear;

  // Search backwards up to 12 months
  for (let i = 0; i < 12; i++) {
    searchMonth--;
    if (searchMonth < 1) {
      searchMonth = 12;
      searchYear--;
    }

    // Query for budgets in this month/year
    const budgets = await budgetRepository.find({
      user: userId,
      month: searchMonth,
      year: searchYear
    });

    if (budgets && budgets.length > 0) {
      return {
        month: searchMonth,
        year: searchYear,
        budgets
      };
    }
  }

  return null; // No budgets found in the last 12 months
};

// Validate import budgets data
export const validateImportBudgets = (budgets, targetMonth, targetYear) => {
  const validCategories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Rent', 'Health', 'Others'];
  const errors = [];

  if (!Array.isArray(budgets) || budgets.length === 0) {
    errors.push('Budgets array must not be empty');
    return errors;
  }

  budgets.forEach((budget, index) => {
    if (!budget.category || !validCategories.includes(budget.category)) {
      errors.push(`Budget at index ${index}: Invalid category`);
    }
    if (budget.limit === undefined || budget.limit === null || budget.limit < 0) {
      errors.push(`Budget at index ${index}: Invalid limit`);
    }
    if (!budget.currency) {
      errors.push(`Budget at index ${index}: Missing currency`);
    }
  });

  if (!targetMonth || targetMonth < 1 || targetMonth > 12) {
    errors.push('Invalid target month');
  }
  if (!targetYear || targetYear < 2000) {
    errors.push('Invalid target year');
  }

  return errors.length > 0 ? errors : null;
};

// Execute budget import with merge or replace strategy
export const executeBudgetImport = async (budgetRepository, userId, budgets, targetMonth, targetYear, strategy) => {
  // If replace strategy, delete all existing budgets for the target month/year
  if (strategy === 'replace') {
    const existingBudgets = await budgetRepository.find({
      user: userId,
      month: targetMonth,
      year: targetYear
    });

    for (const existing of existingBudgets) {
      await budgetRepository.deleteById(existing._id || existing.id);
    }
  }

  // For merge strategy, check which categories already exist
  let existingCategories = [];
  if (strategy === 'merge') {
    const existingBudgets = await budgetRepository.find({
      user: userId,
      month: targetMonth,
      year: targetYear
    });
    existingCategories = existingBudgets.map(b => b.category);
  }

  // Create new budgets
  const createdBudgets = [];
  for (const budget of budgets) {
    // Skip if merge strategy and category already exists
    if (strategy === 'merge' && existingCategories.includes(budget.category)) {
      continue;
    }

    // Prepare budget data (preserves currency and amounts from source)
    const budgetData = await prepareBudgetData({
      user: userId,
      category: budget.category,
      limit: budget.limit,
      currency: budget.currency,
      month: targetMonth,
      year: targetYear,
      thresholds: budget.thresholds || [80, 100]
    });

    const created = await budgetRepository.create(budgetData);
    createdBudgets.push(created);
  }

  return createdBudgets;
};


/*
    NOTE:
    Previous data access methods have been moved to budget.repository.js:
    - getBudgetsByUserAndDate -> budgetRepository.find
    - updateBudget -> budgetRepository.findById + budgetRepository.update
    - deleteBudget -> budgetRepository.deleteById
    - createBudget -> budgetRepository.create
    - getMonthlyBudgetStats -> budgetRepository.aggregate
*/