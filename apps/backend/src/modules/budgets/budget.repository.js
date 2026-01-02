import Budget from './budget.model.js';

export const create = async (budgetData) => {
    return await Budget.create(budgetData);
};

export const findById = async (id) => {
    return await Budget.findById(id);
};

export const find = async (query) => {
    return await Budget.find(query);
};

export const update = async (id, updates) => {
    return await Budget.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteById = async (id) => {
    return await Budget.findByIdAndDelete(id);
};

export const aggregate = async (pipeline) => {
    return await Budget.aggregate(pipeline);
};
