import mongoose from "mongoose";
import Budget from "./budget.model.js";
import Expense from "../expenses/expense.model.js";

export const checkBudgetAlerts = async ({
  userId,
  category,
  month,
  year
}) => {
  // Get budget for that month
  const budget = await Budget.findOne({
    user: new mongoose.Types.ObjectId(userId),
    category,
    month,
    year
  });

  if (!budget) return null; // No budget found for that month

  // Calculate total expenses for that month
  // Start: first day of month at 00:00:00 UTC
  // End: last day of month at 23:59:59.999 UTC
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Get expenses for that month by using mongoose aggregation pipeline
  const expenses = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category,
        date: {
          $gte: start,
          $lte: end
        }
      }
    },
    {
      $group: {
        _id: null, // Group all expenses together
        totalAmount: { $sum: "$amountUSD" } // Sum up all expenses in USD
      }
    }
  ]);

  const totalSpent =
    expenses.length > 0 ? expenses[0].totalAmount : 0; // No expenses found for that month

  // Calculate usage percentage
  // Use amountUSD for the budget limit if available, otherwise fallback to limit (assuming same currency if amountUSD is missing, which might be risky but prevents crash)
  // Ideally both should represent USD if we are summing amountUSD. 
  const budgetLimit = budget.amountUSD || budget.limit;
  if (!budgetLimit) return null;

  const usagePercentage = (totalSpent / budgetLimit) * 100;  // Calculate usage percentage

  // Check if alerts are triggered
  const triggeredAlerts = [];
  // Ensure thresholds exist (defaults for legacy docs)
  let thresholds = budget.thresholds || [];
  if (thresholds.length === 0) {
    thresholds = [80, 100];
  }

  // Ensure alertsTriggered is available (handle case where it might be undefined on old documents)
  if (!budget.alertsTriggered) {
    budget.alertsTriggered = new Map();
  }

  // Sort thresholds in descending order to process highest first
  const sortedThresholds = [...thresholds].sort((a, b) => b - a);
  let highestTriggered = null;

  for (const threshold of sortedThresholds) {
    const alreadyTriggered = budget.alertsTriggered.get(String(threshold));

    // Check if we passed the threshold
    if (usagePercentage >= threshold) {

      // We found the highest threshold crossed. This is the one we want to alert/warn about.
      if (!highestTriggered) {
        highestTriggered = {
          category,
          threshold,
          usage: Math.round(usagePercentage)
        };
      }

      // Update the persistent state if not already set
      if (alreadyTriggered !== true) {
        budget.alertsTriggered.set(String(threshold), true);
      }
    }
  }

  if (highestTriggered) {
    triggeredAlerts.push(highestTriggered);
  }

  // Save only if state changed (we set new keys in map)
  if (budget.isModified('alertsTriggered')) {
    await budget.save();
  }

  return {
    totalSpent,
    usagePercentage: Math.round(usagePercentage),
    alerts: triggeredAlerts
  }
}
