import User from './user.model.js';
import { assertAdmin, assertSameUserOrAdmin, buildError } from '../../utils/authorization.js';

export const getUsers = async (requester) => {
    assertAdmin(requester, 'access users list');
    return await User.find().select('-password');
};

export const getUser = async (userId, requester) => {
    assertSameUserOrAdmin(userId, requester, 'access this user');
    const user = await User.findById(userId).select('-password');
    if(!user) {
        throw buildError('User not found', 404);
    }
    return user;
};

export const createUser = async (userData, requester) => {
    assertAdmin(requester, 'create users');
    const existingUser = await User.findOne({ email: userData.email });
    if(existingUser){
        throw buildError('User already exists', 400);
    }

    const user = await User.create(userData);
    return user;
};

export const updateUser = async (userId, updateData, requester) => {
    assertSameUserOrAdmin(userId, requester, 'update this user');
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    if(!user) {
        throw buildError('User not found', 404);
    }
    return user;
};

export const deleteUser = async (userId, requester) => {
    assertSameUserOrAdmin(userId, requester, 'delete this user');
    const user = await User.findById(userId);
    if(!user) {
        throw buildError('User not found', 404);
    }
    await user.deleteOne();
    return { deleted: true };
};
