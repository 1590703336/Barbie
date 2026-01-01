import Subscription from './subscription.model.js';

export const create = async (data) => {
    return await Subscription.create(data);
};

export const find = async (query, sort = {}) => {
    return await Subscription.find(query).sort(sort);
};

export const findById = async (id) => {
    return await Subscription.findById(id);
};

export const update = async (id, data) => {
    return await Subscription.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const deleteById = async (id) => {
    return await Subscription.findByIdAndDelete(id);
};

export const aggregate = async (pipeline) => {
    return await Subscription.aggregate(pipeline);
};
