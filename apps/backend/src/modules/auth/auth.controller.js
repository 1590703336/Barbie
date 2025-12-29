import * as authService from './auth.service.js';

export const signUp = async (req, res, next) => {
    try {
        const result = await authService.signUp(req.body);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.signIn(email, password);
        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const signOut = async (req, res, next) => {
    // Implementation for sign out if needed, usually just clearing cookie on client side for JWT
    res.status(200).json({
        success: true,
        message: 'User signed out successfully',
    });
};
