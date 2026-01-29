/**
 * Admin Dashboard Routes
 * 
 * API routes for admin dashboard and user management.
 * All routes require admin authentication.
 * Base path: /api/admin
 */

import { Router } from 'express';
import * as adminDashboardController from './admin.dashboard.controller.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';

const adminDashboardRouter = Router();

// Apply admin authentication to all routes
adminDashboardRouter.use(requireAdmin);

// ===== Platform Overview =====
// GET /api/admin/overview - Platform KPIs
adminDashboardRouter.get('/overview', adminDashboardController.getPlatformOverview);

// ===== User Analytics =====
// GET /api/admin/users/growth - User registration trend
adminDashboardRouter.get('/users/growth', adminDashboardController.getUserGrowthTrend);

// ===== Financial Analytics =====
// GET /api/admin/analytics/financials - Platform financials
adminDashboardRouter.get('/analytics/financials', adminDashboardController.getPlatformFinancials);

// GET /api/admin/analytics/categories - Category distribution
adminDashboardRouter.get('/analytics/categories', adminDashboardController.getCategoryDistribution);

// GET /api/admin/analytics/budget-compliance - Budget compliance
adminDashboardRouter.get('/analytics/budget-compliance', adminDashboardController.getBudgetCompliance);

// ===== Subscription Analytics =====
// GET /api/admin/subscriptions/health - Subscription health metrics
adminDashboardRouter.get('/subscriptions/health', adminDashboardController.getSubscriptionHealth);

// ===== Currency Analytics =====
// GET /api/admin/currency/stats - Currency usage statistics
adminDashboardRouter.get('/currency/stats', adminDashboardController.getCurrencyStats);

// ===== User Management =====
// GET /api/admin/users - List all users (paginated)
adminDashboardRouter.get('/users', adminDashboardController.getAllUsers);

// GET /api/admin/users/:id - Get user details
adminDashboardRouter.get('/users/:id', adminDashboardController.getUserDetails);

// PATCH /api/admin/users/:id/role - Update user role
adminDashboardRouter.patch('/users/:id/role', adminDashboardController.updateUserRole);

// DELETE /api/admin/users/:id - Delete user
adminDashboardRouter.delete('/users/:id', adminDashboardController.deleteUser);

export default adminDashboardRouter;
