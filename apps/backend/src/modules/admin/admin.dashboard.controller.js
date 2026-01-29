/**
 * Admin Dashboard Controller
 * 
 * Handles HTTP requests for admin dashboard and user management endpoints.
 * All endpoints require admin authentication via requireAdmin middleware.
 */

import * as adminDashboardService from './admin.dashboard.service.js';

/**
 * GET /api/admin/overview
 * Get platform overview statistics (KPIs).
 */
export const getPlatformOverview = async (req, res, next) => {
    try {
        const overview = await adminDashboardService.getPlatformOverview();

        res.status(200).json({
            success: true,
            data: overview
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/users/growth
 * Get user registration growth trend.
 * 
 * Query params:
 *   - granularity: 'weekly' | 'monthly' | 'yearly' (default: 'monthly')
 *   - count: number of periods (default: 12)
 */
export const getUserGrowthTrend = async (req, res, next) => {
    try {
        const { granularity = 'monthly', count = 12 } = req.query;

        const trend = await adminDashboardService.getUserGrowthTrend(
            granularity,
            parseInt(count, 10)
        );

        res.status(200).json({
            success: true,
            data: trend
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/analytics/financials
 * Get platform-wide financial summary.
 * 
 * Query params:
 *   - months: number of months to include (default: 6)
 */
export const getPlatformFinancials = async (req, res, next) => {
    try {
        const { months = 6 } = req.query;

        const financials = await adminDashboardService.getPlatformFinancials(
            parseInt(months, 10)
        );

        res.status(200).json({
            success: true,
            data: financials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/analytics/categories
 * Get platform-wide category distribution.
 * 
 * Query params:
 *   - type: 'expense' | 'income' (default: 'expense')
 *   - month: month number (1-12)
 *   - year: year
 */
export const getCategoryDistribution = async (req, res, next) => {
    try {
        const { type = 'expense', month, year } = req.query;

        const distribution = await adminDashboardService.getCategoryDistribution(
            type,
            month ? parseInt(month, 10) : undefined,
            year ? parseInt(year, 10) : undefined
        );

        res.status(200).json({
            success: true,
            data: distribution
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/analytics/budget-compliance
 * Get budget compliance metrics.
 * 
 * Query params:
 *   - month: month number (1-12)
 *   - year: year
 */
export const getBudgetCompliance = async (req, res, next) => {
    try {
        const { month, year } = req.query;

        const compliance = await adminDashboardService.getBudgetCompliance(
            month ? parseInt(month, 10) : undefined,
            year ? parseInt(year, 10) : undefined
        );

        res.status(200).json({
            success: true,
            data: compliance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/subscriptions/health
 * Get subscription health metrics.
 */
export const getSubscriptionHealth = async (req, res, next) => {
    try {
        const health = await adminDashboardService.getSubscriptionHealth();

        res.status(200).json({
            success: true,
            data: health
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/currency/stats
 * Get currency usage and popular conversion pairs.
 */
export const getCurrencyStats = async (req, res, next) => {
    try {
        const stats = await adminDashboardService.getPopularCurrencyPairs();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering.
 * 
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 *   - search: search term for name/email
 *   - role: filter by role
 *   - sortBy: field to sort by (default: 'createdAt')
 *   - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { page, limit, search, role, sortBy, sortOrder } = req.query;

        const result = await adminDashboardService.getAllUsers({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            search,
            role,
            sortBy,
            sortOrder
        });

        res.status(200).json({
            success: true,
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/users/:id
 * Get user details with activity summary.
 */
export const getUserDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [user, activity] = await Promise.all([
            adminDashboardService.getAllUsers({ search: '', role: '' }),
            adminDashboardService.getUserActivity(id)
        ]);

        // Find specific user
        const targetUser = user.users.find(u => u._id.toString() === id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: targetUser,
                activity
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/admin/users/:id/role
 * Update user role.
 * 
 * Body:
 *   - role: 'user' | 'admin'
 */
export const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be "user" or "admin"'
            });
        }

        const user = await adminDashboardService.updateUserRole(id, role);

        res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user and all associated data.
 */
export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own admin account'
            });
        }

        const result = await adminDashboardService.deleteUser(id);

        res.status(200).json({
            success: true,
            message: 'User and all associated data deleted successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
