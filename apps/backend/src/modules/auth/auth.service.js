import mongoose from 'mongoose';
import * as userRepository from '../user/user.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../config/env.js';

export const signUp = async (userData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, email, password, defaultCurrency } = userData;

        const existingUser = await userRepository.findOne({ email });
        if (existingUser) {
            const error = new Error('User already exists');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Transactional create using the repository
        // Repository 'create' handles array input for transaction
        const newUser = await userRepository.create([{
            name,
            email,
            password: hashedPassword,
            defaultCurrency: defaultCurrency || 'USD'
        }], session);

        // newUser is an array because we passed an array
        const userObj = newUser[0];
        const token = jwt.sign({ userId: userObj._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        await session.commitTransaction();
        session.endSession();

        return { user: userObj, token };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

export const signIn = async (email, password) => {

    const user = await userRepository.findOne({ email });
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        const error = new Error('Invalid password');
        error.statusCode = 401;
        throw error;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { user, token };
};
