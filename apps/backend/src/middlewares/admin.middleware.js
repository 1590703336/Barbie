/**
 * Admin Middleware
 * 
 * Middleware for protecting admin-only routes.
 * Verifies JWT token and checks admin role.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import * as userRepository from '../modules/user/user.repository.js';

/**
 * Require Admin Middleware
 * 
 * Validates the JWT token and ensures the user has admin role.
 * Adds the admin user to req.user for downstream handlers.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please log in again.',
                    code: 'SESSION_EXPIRED'
                });
            }
            throw error;
        }

        // Verify it's an admin token
        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin privileges required'
            });
        }

        // Fetch user and verify admin role still exists
        // Use repository to ensure consistent data access and respect clean architecture
        const user = await userRepository.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Admin user not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin privileges have been revoked'
            });
        }

        // Attach admin user to request
        req.user = user;
        req.isAdmin = true;

        next();
    } catch (error) {
        console.error('Admin auth error:', error.message);
        res.status(401).json({
            success: false,
            message: 'Admin authentication failed',
            error: error.message
        });
    }
};

export default requireAdmin;
