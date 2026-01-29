/**
 * Admin Analytics Repository
 * 
 * Encapsulates all database queries for admin dashboard analytics.
 * This is the ONLY file in the admin module allowed to import models directly.
 * Follows Clean Architecture: Services call Repository, Repository calls Models.
 */

import mongoose from 'mongoose';
import User from '../user/user.model.js';
import Expense from '../expenses/expense.model.js';
import Income from '../income/income.model.js';
import Budget from '../budgets/budget.model.js';
import Subscription from '../subscription/subscription.model.js';
import ConvertPair from '../convertPair/convertPair.model.js';

// ============ USER QUERIES ============

export const countUsers = async (filter = {}) => {
    return User.countDocuments(filter);
};

export const findUsers = async (query, options = {}) => {
    const { skip = 0, limit = 20, sort = { createdAt: -1 }, select = '-password -__v' } = options;
    return User.find(query).select(select).sort(sort).skip(skip).limit(limit);
};

export const aggregateUsers = async (pipeline) => {
    return User.aggregate(pipeline);
};

export const updateUserById = async (userId, data) => {
    return User.findByIdAndUpdate(userId, data, { new: true, runValidators: true }).select('-password -__v');
};

export const deleteUserById = async (userId) => {
    return User.findByIdAndDelete(userId);
};

// ============ EXPENSE QUERIES ============

export const countExpenses = async (filter = {}) => {
    return Expense.countDocuments(filter);
};

export const aggregateExpenses = async (pipeline) => {
    return Expense.aggregate(pipeline);
};

export const distinctExpenseCurrencies = async () => {
    return Expense.distinct('currency');
};

export const deleteExpensesByUser = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Expense.deleteMany({ user: userObjectId });
};

// ============ INCOME QUERIES ============

export const countIncomes = async (filter = {}) => {
    return Income.countDocuments(filter);
};

export const aggregateIncomes = async (pipeline) => {
    return Income.aggregate(pipeline);
};

export const distinctIncomeCurrencies = async () => {
    return Income.distinct('currency');
};

export const deleteIncomesByUser = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Income.deleteMany({ user: userObjectId });
};

// ============ BUDGET QUERIES ============

export const findBudgets = async (filter = {}) => {
    return Budget.find(filter);
};

export const findBudgetsByUser = async (userId, options = {}) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { select = 'category limit currency year month', sort = { year: -1, month: -1 } } = options;
    return Budget.find({ user: userObjectId }).select(select).sort(sort);
};

export const deleteBudgetsByUser = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Budget.deleteMany({ user: userObjectId });
};

// ============ SUBSCRIPTION QUERIES ============

export const countSubscriptions = async (filter = {}) => {
    return Subscription.countDocuments(filter);
};

export const aggregateSubscriptions = async (pipeline) => {
    return Subscription.aggregate(pipeline);
};

export const findSubscriptionsByUser = async (userId, options = {}) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { select = 'name price currency amountUSD category status frequency startDate renewalDate', sort = { renewalDate: 1 } } = options;
    return Subscription.find({ user: userObjectId }).select(select).sort(sort);
};

export const distinctSubscriptionCurrencies = async () => {
    return Subscription.distinct('currency');
};

export const deleteSubscriptionsByUser = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Subscription.deleteMany({ user: userObjectId });
};

// ============ CONVERT PAIR QUERIES ============

export const countConvertPairs = async (filter = {}) => {
    return ConvertPair.countDocuments(filter);
};

export const aggregateConvertPairs = async (pipeline) => {
    return ConvertPair.aggregate(pipeline);
};

export const deleteConvertPairsByUser = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return ConvertPair.deleteMany({ user: userObjectId });
};
