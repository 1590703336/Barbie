import ConvertPair from './convertPair.model.js';

export const create = async (data) => {
    return await ConvertPair.create(data);
};

export const findByUser = async (userId) => {
    return await ConvertPair.find({ user: userId }).sort({ createdAt: -1 });
};

export const findById = async (id) => {
    return await ConvertPair.findById(id);
};

export const update = async (id, data) => {
    return await ConvertPair.findByIdAndUpdate(id, data, { new: true });
};

export const deleteById = async (id) => {
    return await ConvertPair.findByIdAndDelete(id);
};
