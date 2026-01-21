/**
 * Analytics Routes
 * 
 * Defines API routes for analytics endpoints.
 * All routes require authentication.
 */

import { Router } from 'express';
import authorize from '../../middlewares/auth.middleware.js';
import * as analyticsController from './analytics.controllers.js';

const analyticsRouter = Router();

// All analytics routes require authentication
analyticsRouter.use(authorize);

/**
 * GET /api/analytics/trend
 * Get income/expense trend data grouped by period
 * Query: granularity, count, userId
 */
analyticsRouter.get('/trend', analyticsController.getTrendDataController);

/**
 * GET /api/analytics/category-breakdown
 * Get expense/income breakdown by category for a specific month
 * Query: type, month, year, limit, userId
 */
analyticsRouter.get('/category-breakdown', analyticsController.getCategoryBreakdownController);

/**
 * GET /api/analytics/monthly-comparison
 * Compare income, expenses, savings across multiple months
 * Query: months, userId
 */
analyticsRouter.get('/monthly-comparison', analyticsController.getMonthlyComparisonController);

/**
 * GET /api/analytics/budget-usage
 * Get budget utilization per category for a specific month
 * Query: month, year, sortBy, sortOrder, userId
 */
analyticsRouter.get('/budget-usage', analyticsController.getBudgetUsageController);

export default analyticsRouter;
