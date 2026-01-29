/**
 * Admin Auth Routes
 * 
 * API routes for admin authentication.
 * Base path: /api/admin/auth
 */

import { Router } from 'express';
import * as adminAuthController from './admin.auth.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import { adminSignInSchema } from './admin.auth.validation.js';

const adminAuthRouter = Router();

// POST /api/admin/auth/sign-in - Admin login
adminAuthRouter.post('/sign-in', validate(adminSignInSchema), adminAuthController.adminSignIn);

// POST /api/admin/auth/sign-out - Admin logout
adminAuthRouter.post('/sign-out', adminAuthController.adminSignOut);

// POST /api/admin/auth/refresh - Refresh admin session
adminAuthRouter.post('/refresh', adminAuthController.refreshSession);

// GET /api/admin/auth/me - Get current admin user
adminAuthRouter.get('/me', adminAuthController.getCurrentAdmin);

export default adminAuthRouter;
