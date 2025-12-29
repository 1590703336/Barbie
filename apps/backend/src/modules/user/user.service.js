import User from './user.model.js';

export const getUsers = async () => {
    return await User.find();
};

export const getUser = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if(!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

export const createUser = async (userData) => {
    const existingUser = await User.findOne({ email: userData.email });
    if(existingUser){
        const error = new Error('User already exists');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create(userData);
    return user;
};

export const updateUser = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if(!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

export const deleteUser = async (userId) => {
    const user = await User.findById(userId);
    if(!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    await user.deleteOne();
    return { deleted: true };
};
