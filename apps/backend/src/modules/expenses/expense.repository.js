import Expense from "./expense.model.js";

// Create a new expense
export const create = async (data) => {
    return await Expense.create(data);
};

// Find an expense by ID
export const findById = async (id) => {
    return await Expense.findById(id);
};

// Find expenses by user with optional filters
export const findByUser = async (userId, filters = {}) => {
    const query = { user: userId };

    if (filters.month && filters.year) {
        const start = new Date(filters.year, filters.month - 1, 1);
        const end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
    }

    if (filters.category) {
        query.category = filters.category;
    }

    return await Expense.find(query);
};

// Find expenses by arbitrary query
export const find = async (query) => {
    return await Expense.find(query);
};

// Update an expense by ID
export const update = async (id, data) => {
    return await Expense.findByIdAndUpdate(id, data, { new: true });
};

// Delete an expense by ID
export const deleteById = async (id) => {
    return await Expense.findByIdAndDelete(id);
};

// Aggregate expenses
export const aggregate = async (pipeline) => {
    return await Expense.aggregate(pipeline);
};
