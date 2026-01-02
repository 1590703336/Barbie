import bcrypt from 'bcryptjs';
import * as userRepository from './user.repository.js';
import { buildError } from '../../utils/authorization.js';

export const getUsers = async (filter = {}) => {
    // Business logic: just return data, controller handles auth
    return await userRepository.find(filter);
};

export const getUser = async (userId) => {
    // Controller handles auth
    const user = await userRepository.findById(userId);
    if (!user) {
        throw buildError('User not found', 404);
    }
    return user;
};

export const prepareUserData = async (userData) => {
    const processedData = { ...userData };

    // Hash password if present
    if (processedData.password) {
        const salt = await bcrypt.genSalt(10);
        processedData.password = await bcrypt.hash(processedData.password, salt);
    }

    return processedData;
};

export const createUser = async (userData) => {
    const existingUser = await userRepository.findOne({ email: userData.email });
    if (existingUser) {
        throw buildError('User already exists', 400);
    }

    // Hash password before saving
    const dataToSave = await prepareUserData(userData);
    return await userRepository.create(dataToSave);
};

export const updateUser = async (userId, updateData) => {
    // Prepare data (hashing if needed)
    const dataToSave = await prepareUserData(updateData);

    const user = await userRepository.update(userId, dataToSave);
    if (!user) {
        throw buildError('User not found', 404);
    }
    return user;
};

export const deleteUser = async (userId) => {
    const result = await userRepository.deleteById(userId);
    if (!result) {
        throw buildError('User not found', 404);
    }
    return { deleted: true };
};
