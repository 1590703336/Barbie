import Income from './income.model.js';

export const create = async (incomeData) => {
    return await Income.create(incomeData);
};

export const find = async (query) => {
    return await Income.find(query).sort({ date: -1 });
};

export const findById = async (id) => {
    return await Income.findById(id);
};

export const update = async (id, updates) => {
    return await Income.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteById = async (id) => {
    return await Income.findByIdAndDelete(id);
};

export const aggregate = async (pipeline) => {
    return await Income.aggregate(pipeline);
};
