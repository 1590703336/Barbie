// import mongoose from "mongoose"; // Removed
// import Expense from "./expense.model.js"; // Removed
// import { assertOwnerOrAdmin, assertSameUserOrAdmin, buildError } from "../../utils/authorization.js"; // Removed - Auth moved to controller
import { convertToUSD } from '../currency/currency.service.js';

/**
 * Prepares expense data for creation/update by calculating USD amount.
 * @param {Object} data - The expense data (amount, currency).
 * @param {Object} [currentData] - The existing expense data (for updates).
 * @returns {Promise<Object>} - The data with amountUSD added/updated.
 */
export const prepareExpenseData = async (data, currentData = {}) => {
  const processedData = { ...data };

  // Determine effective amount and currency
  const amount = data.amount || currentData.amount;
  const currency = data.currency || currentData.currency;

  if (amount && currency) {
    processedData.amountUSD = await convertToUSD(amount, currency);
  }

  return processedData;
};

/**
 * Calculates the total expenses from a list of expenses.
 * @param {Array} expenses - List of expense objects.
 * @returns {number} - Total expenses in USD (or fallback to amount).
 */
export const calculateTotalExpenses = (expenses) => {
  return expenses.reduce((total, expense) => total + (expense.amountUSD || expense.amount), 0);
};

/**
 * Prepares the aggregation pipeline for monthly stats.
 * @param {string} userId - The user ID.
 * @param {number} month - The month (1-12).
 * @param {number} year - The year.
 * @returns {Array} - Mongoose aggregation pipeline.
 */
export const buildMonthlyStatsPipeline = (userId, month, year) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return [
    {
      $match: {
        user: userId, // userId should be an ObjectId
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$category",
        totalExpensesUSD: { $sum: { $ifNull: ["$amountUSD", "$amount"] } }
      }
    }
  ];
};

// Note: database operations have been moved to expense.repository.js
// expense.service.js now focuses on business logic only.