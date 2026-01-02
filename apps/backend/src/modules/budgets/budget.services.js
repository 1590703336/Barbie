import { convertToUSD } from '../currency/currency.service.js';
import mongoose from 'mongoose'; // Only for Types.ObjectId if needed for pipeline construction

// Prepare budget data (creation or update) by calculating USD amount
export const prepareBudgetData = async (budgetData, existingBudget = {}) => {
  const processedData = { ...budgetData };

  // If currency or limit is being updated, or if it's a new budget
  if (processedData.limit || processedData.currency) {
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

/*
    NOTE:
    Previous data access methods have been moved to budget.repository.js:
    - getBudgetsByUserAndDate -> budgetRepository.find
    - updateBudget -> budgetRepository.findById + budgetRepository.update
    - deleteBudget -> budgetRepository.deleteById
    - createBudget -> budgetRepository.create
    - getMonthlyBudgetStats -> budgetRepository.aggregate
*/