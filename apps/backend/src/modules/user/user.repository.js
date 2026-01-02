import User from './user.model.js';

export const find = async (filter) => {
    return await User.find(filter).select('-password');
};

export const findOne = async (filter) => {
    return await User.findOne(filter);
};

export const findById = async (id) => {
    return await User.findById(id).select('-password');
};

export const findByIdWithPassword = async (id) => {
    return await User.findById(id);
};

export const create = async (data, session = null) => {
    const options = session ? { session } : {};
    // User.create returns an array if passed an array, or object if object.
    // Normalized to handle standard object creation primarily.
    // If array (transaction usage), returns array.
    if (Array.isArray(data)) {
        return await User.create(data, options);
    }
    return await User.create([data], options).then(docs => docs[0]);
};

export const update = async (id, data) => {
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
};

export const deleteById = async (id) => {
    const user = await User.findById(id);
    if (!user) return null;
    await user.deleteOne();
    return true;
};
