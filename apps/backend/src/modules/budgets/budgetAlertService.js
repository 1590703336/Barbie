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

  if (!budget) return null;

  // Calculate total expenses for that month
  // Start: first day of month at 00:00:00
  // End: last day of month at 23:59:59.999
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

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
        _id: null,
        totalAmount: { $sum: "$amount" }
      }
    }
  ]);

  const totalSpent =
    expenses.length > 0 ? expenses[0].totalAmount : 0;


  const usagePercentage = (totalSpent / budget.limit) * 100;

  const triggeredAlerts = [];

  for (const threshold of budget.thresholds) {
    const alreadyTriggered = budget.alertsTriggered.get(
      String(threshold)
    );

    if (usagePercentage >= threshold && alreadyTriggered === false) {
      budget.alertsTriggered.set(String(threshold), true);

      triggeredAlerts.push({
        category,
        threshold,
        usage: Math.round(usagePercentage)
      });
    }
  }

  // Save only if alerts changed
  if (triggeredAlerts.length > 0) {
    await budget.save();
  }

  return {
    totalSpent,
    usagePercentage: Math.round(usagePercentage),
    alerts: triggeredAlerts
  }
}
