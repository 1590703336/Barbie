/**
 * Admin Auth Controller
 * 
 * Handles HTTP requests for admin authentication endpoints.
 * Uses admin.auth.service for business logic.
 */

import * as adminAuthService from './admin.auth.service.js';

/**
 * Sanitize user object by removing sensitive fields.
 */
const sanitizeUser = (user) => {
    if (!user) return user;
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
};

/**
 * POST /api/admin/auth/sign-in
 * Admin login endpoint.
 */
export const adminSignIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await adminAuthService.adminSignIn(email, password);

        res.status(200).json({
            success: true,
            message: 'Admin signed in successfully',
            data: {
                user: sanitizeUser(result.user),
                token: result.token,
                expiresAt: result.expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/auth/sign-out
 * Admin logout endpoint.
 * Note: JWT tokens are stateless, so logout is handled client-side.
 * This endpoint is for consistency and potential future server-side session tracking.
 */
export const adminSignOut = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Admin signed out successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/auth/refresh
 * Refresh admin session by issuing a new token.
 */
export const refreshSession = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const result = await adminAuthService.refreshAdminSession(token);

        res.status(200).json({
            success: true,
            message: 'Session refreshed successfully',
            data: {
                token: result.token,
                expiresAt: result.expiresAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/auth/me
 * Get current authenticated admin user.
 */
export const getCurrentAdmin = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const user = await adminAuthService.getCurrentAdmin(token);

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};
