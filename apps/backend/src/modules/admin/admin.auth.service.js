/**
 * Admin Auth Service
 * 
 * Handles admin-specific authentication with short-lived tokens and role verification.
 * Admin tokens expire in 30 minutes by default (configurable).
 */

import * as userRepository from '../user/user.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/env.js';

// Admin session duration (30 minutes default)
const ADMIN_SESSION_DURATION = process.env.ADMIN_SESSION_DURATION || '30m';

/**
 * Admin Sign In
 * Validates credentials and verifies admin role before issuing token.
 * 
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Object} { user, token, expiresIn }
 */
export const adminSignIn = async (email, password) => {
    // Find user by email
    const user = await userRepository.findOne({ email });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    // Verify admin role
    if (user.role !== 'admin') {
        const error = new Error('Access denied. Admin privileges required.');
        error.statusCode = 403;
        throw error;
    }

    // Generate admin-specific token with shorter expiry
    const token = jwt.sign(
        {
            userId: user._id,
            isAdmin: true,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: ADMIN_SESSION_DURATION }
    );

    // Calculate expiry timestamp for frontend session management
    const decoded = jwt.decode(token);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds

    return {
        user,
        token,
        expiresAt
    };
};

/**
 * Verify Admin Token
 * Validates token and ensures it's an admin token.
 * 
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAdminToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.isAdmin) {
            const error = new Error('Invalid admin token');
            error.statusCode = 401;
            throw error;
        }

        // Verify user still exists and is still admin
        const user = await userRepository.findById(decoded.userId);
        if (!user || user.role !== 'admin') {
            const error = new Error('Admin privileges revoked');
            error.statusCode = 403;
            throw error;
        }

        return { decoded, user };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const expiredError = new Error('Session expired. Please log in again.');
            expiredError.statusCode = 401;
            throw expiredError;
        }
        throw error;
    }
};

/**
 * Refresh Admin Session
 * Issues a new token if the current one is still valid.
 * 
 * @param {string} currentToken - Current valid JWT token
 * @returns {Object} { token, expiresAt }
 */
export const refreshAdminSession = async (currentToken) => {
    const { decoded, user } = await verifyAdminToken(currentToken);

    // Issue new token with fresh expiry
    const newToken = jwt.sign(
        {
            userId: user._id,
            isAdmin: true,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: ADMIN_SESSION_DURATION }
    );

    const newDecoded = jwt.decode(newToken);

    return {
        token: newToken,
        expiresAt: newDecoded.exp * 1000
    };
};

/**
 * Get Current Admin
 * Returns admin user info from token.
 * 
 * @param {string} token - JWT token
 * @returns {Object} User object (sanitized)
 */
export const getCurrentAdmin = async (token) => {
    const { user } = await verifyAdminToken(token);

    // Return sanitized user object
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.__v;

    return userObj;
};
